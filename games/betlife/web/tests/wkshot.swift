// BetLife visual-capture and interaction tool — WebKit only (WKWebView). No Chromium anywhere.
//
// Build:   swiftc -O tests/wkshot.swift -o tests/wkshot
// Capture: wkshot shoot <outdir> <base-url> name=query ...      (390x844 viewport, snapshot 585px wide = 1.5x)
// Inspect: wkshot eval  <url> '<javascript>'                    (prints the JSON result)
// Drive:   wkshot drive <url> <script.json>                     (steps: wait/eval/click/shot — real NSEvent clicks)
//
// The window is placed offscreen, so nothing appears on the user's display.

import AppKit
import WebKit

// Defaults match the reference frames (585/390 = 1.5x). WK_W / WK_H / WK_SHOT_W override them for other viewports.
func envSize(_ key: String, _ fallback: CGFloat) -> CGFloat {
  guard let raw = ProcessInfo.processInfo.environment[key], let value = Double(raw), value > 0 else { return fallback }
  return CGFloat(value)
}
let VIEW_W: CGFloat = envSize("WK_W", 390)
let VIEW_H: CGFloat = envSize("WK_H", 844)
let SHOT_W: CGFloat = envSize("WK_SHOT_W", VIEW_W == 390 ? 585 : VIEW_W)

final class Shooter: NSObject, WKNavigationDelegate {
  let webView: WKWebView
  let window: NSWindow
  var loadDone = false

  override init() {
    let config = WKWebViewConfiguration()
    config.preferences.setValue(true, forKey: "developerExtrasEnabled")
    let prefs = WKWebpagePreferences()
    prefs.allowsContentJavaScript = true
    config.defaultWebpagePreferences = prefs
    webView = WKWebView(frame: NSRect(x: 0, y: 0, width: VIEW_W, height: VIEW_H), configuration: config)
    window = NSWindow(contentRect: NSRect(x: -4000, y: -4000, width: VIEW_W, height: VIEW_H),
                      styleMask: [.borderless], backing: .buffered, defer: false)
    super.init()
    window.contentView = webView
    window.makeKeyAndOrderFront(nil)
    webView.navigationDelegate = self
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { loadDone = true }
  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { loadDone = true }
  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { loadDone = true }

  func spin(_ seconds: Double) {
    let until = Date().addingTimeInterval(seconds)
    while Date() < until { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
  }

  func load(_ url: String, settle: Double = 1.6) {
    loadDone = false
    var request = URLRequest(url: URL(string: url)!)
    request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
    webView.load(request)
    let deadline = Date().addingTimeInterval(25)
    while !loadDone && Date() < deadline { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
    // Wait for the app to render its first screen (module scripts resolve after load).
    for _ in 0..<40 {
      if let ready = evalSync("(function(){var g=document.getElementById('game');return !!g && g.children.length>0;})()") as? Bool, ready { break }
      spin(0.25)
    }
    spin(settle)
  }

  @discardableResult
  func evalSync(_ js: String) -> Any? {
    var result: Any?
    var finished = false
    // Wrap so expressions and statements both work, and promises resolve.
    let wrapped = "(function(){ try { return eval(\(jsonString(js))); } catch (e) { return 'ERR: ' + (e && e.message ? e.message : e); } })()"
    webView.evaluateJavaScript(wrapped) { value, error in
      result = error == nil ? value : "ERR: \(error!.localizedDescription)"
      finished = true
    }
    let deadline = Date().addingTimeInterval(20)
    while !finished && Date() < deadline { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
    return result
  }

  func jsonString(_ s: String) -> String {
    let data = try! JSONSerialization.data(withJSONObject: [s], options: [])
    var text = String(data: data, encoding: .utf8)!
    text.removeFirst(); text.removeLast()
    return text
  }

  // A real click: WebKit hit-tests the NSEvent exactly like a user click.
  func click(x: CGFloat, y: CGFloat) {
    let point = NSPoint(x: x, y: VIEW_H - y)   // page coords (top-left) -> view coords (bottom-left)
    // A navigation can drop the offscreen window's key status; without it sendEvent never reaches the page.
    window.makeKeyAndOrderFront(nil)
    window.makeFirstResponder(webView)
    spin(0.05)
    if let move = NSEvent.mouseEvent(with: .mouseMoved, location: point, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                     windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: 0, pressure: 0) {
      window.sendEvent(move)
      spin(0.05)
    }
    // Deliver straight to the view under the point: after a navigation WebKit swaps its content view and
    // window-level routing can drop the event before it reaches the page.
    let target = webView.hitTest(point) ?? webView
    for type in [NSEvent.EventType.leftMouseDown, .leftMouseUp] {
      if let event = NSEvent.mouseEvent(with: type, location: point, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                        windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: type == .leftMouseDown ? 1 : 0) {
        if type == .leftMouseDown { target.mouseDown(with: event) } else { target.mouseUp(with: event) }
      }
      spin(0.06)
    }
    spin(0.45)
  }

  func snapshot(to path: String) -> Bool {
    let config = WKSnapshotConfiguration()
    config.snapshotWidth = NSNumber(value: Double(SHOT_W))
    var ok = false
    var finished = false
    webView.takeSnapshot(with: config) { image, _ in
      // Normalize to exactly SHOT_W pixels wide (1.5x of the 390pt viewport), whatever the display backing scale is.
      if let image = image {
        let height = (SHOT_W * VIEW_H / VIEW_W).rounded()
        let target = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(SHOT_W), pixelsHigh: Int(height),
                                      bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                      colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        target.size = NSSize(width: SHOT_W, height: height)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: target)
        NSGraphicsContext.current?.imageInterpolation = .high
        image.draw(in: NSRect(x: 0, y: 0, width: SHOT_W, height: height),
                   from: .zero, operation: .copy, fraction: 1.0)
        NSGraphicsContext.restoreGraphicsState()
        if let png = target.representation(using: .png, properties: [:]) {
          try? png.write(to: URL(fileURLWithPath: path))
          ok = true
        }
      }
      finished = true
    }
    let deadline = Date().addingTimeInterval(20)
    while !finished && Date() < deadline { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02)) }
    return ok
  }
}

func describe(_ value: Any?) -> String {
  guard let value = value else { return "null" }
  if JSONSerialization.isValidJSONObject(value), let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]) {
    return String(data: data, encoding: .utf8) ?? "\(value)"
  }
  return "\(value)"
}

let args = CommandLine.arguments
guard args.count >= 3 else {
  print("usage: wkshot shoot <outdir> <base-url> name=query ... | wkshot eval <url> <js> | wkshot drive <url> <script.json>")
  exit(2)
}
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)   // no dock icon, nothing visible
let mode = args[1]
let shooter = Shooter()

switch mode {
case "shoot":
  let outDir = args[2], base = args[3]
  try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
  for pair in args.dropFirst(4) {
    guard let eq = pair.firstIndex(of: "=") else { continue }
    let name = String(pair[pair.startIndex..<eq])
    let query = String(pair[pair.index(after: eq)...])
    let sep = query.hasPrefix("#") ? "" : "&"
    shooter.load("\(base)?r=\(Int(Date().timeIntervalSince1970 * 1000))\(sep)\(query)")
    let ok = shooter.snapshot(to: "\(outDir)/\(name).png")
    print(ok ? name : "\(name)[FAILED]", terminator: " ")
    fflush(stdout)
  }
  print("")

case "eval":
  shooter.load(args[2])
  print(describe(shooter.evalSync(args[3])))

case "drive":
  // JSON: [{"load":"url"}, {"eval":"js"}, {"click":[x,y]}, {"wait":1.0}, {"shot":"/path.png"}]
  let data = FileManager.default.contents(atPath: args[3])!
  let steps = try! JSONSerialization.jsonObject(with: data) as! [[String: Any]]
  shooter.load(args[2])
  for step in steps {
    if let url = step["load"] as? String { shooter.load(url) }
    if let js = step["eval"] as? String { print("EVAL \(describe(shooter.evalSync(js)))") }
    if let point = step["click"] as? [Double], point.count == 2 { shooter.click(x: CGFloat(point[0]), y: CGFloat(point[1])); print("CLICK \(point[0]),\(point[1])") }
    if let selector = step["clickSel"] as? String ?? step["clickText"] as? String {
      let byText = step["clickText"] != nil
      let finder = byText
        ? "(function(){var t=\(shooter.jsonString(selector)).toLowerCase();var els=[].slice.call(document.querySelectorAll('button, .bl-row, .bl-nav-item, [data-choice], [data-action]'));var e=els.filter(function(n){return n.offsetParent!==null && n.textContent.replace(/\\s+/g,' ').trim().toLowerCase().indexOf(t)>=0;})[0];if(!e)return null;e.scrollIntoView({block:'center'});var b=e.getBoundingClientRect();return [b.left+b.width/2, b.top+b.height/2];})()"
        : "(function(){var e=document.querySelector(\(shooter.jsonString(selector)));if(!e)return null;e.scrollIntoView({block:'center'});var b=e.getBoundingClientRect();return [b.left+b.width/2, b.top+b.height/2];})()"
      shooter.spin(0.15)
      if let point = shooter.evalSync(finder) as? [Any], point.count == 2,
         let x = (point[0] as? NSNumber)?.doubleValue, let y = (point[1] as? NSNumber)?.doubleValue {
        shooter.click(x: CGFloat(x), y: CGFloat(y))
        print("CLICK \(selector) @ \(Int(x)),\(Int(y))")
      } else {
        print("CLICK \(selector) NOT FOUND")
      }
    }
    if let seconds = step["wait"] as? Double { shooter.spin(seconds) }
    if let path = step["shot"] as? String { print(shooter.snapshot(to: path) ? "SHOT \(path)" : "SHOT FAILED") }
  }

default:
  print("unknown mode \(mode)"); exit(2)
}
exit(0)
