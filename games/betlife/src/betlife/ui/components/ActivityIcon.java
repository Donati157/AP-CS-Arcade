package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.Icon;

/**
 * Original outline icons for the activity categories, drawn at any size in any color
 * with the same line style as the navigation icons.
 */
public class ActivityIcon implements Icon {

    public static final String MIND_BODY = "mindBody";
    public static final String DOCTOR = "doctor";
    public static final String LIBRARY = "library";
    public static final String SHOPPING = "shopping";
    public static final String RECREATION = "recreation";
    public static final String PERSON = "person";
    public static final String ARROW_UP = "arrowUp";
    public static final String ARROW_DOWN = "arrowDown";
    public static final String HEART = "heart";
    public static final String CHAT = "chat";
    public static final String BIKE = "bike";
    public static final String WALLET = "wallet";
    public static final String SUN = "sun";
    public static final String FOOTPRINTS = "footprints";
    public static final String SCHOOL_CAP = "schoolCap";
    public static final String BRIEFCASE = "briefcase";
    public static final String CAR = "car";
    public static final String INFO = "info";
    public static final String EXIT = "exit";

    private final String kind;
    private final int size;
    private final Color color;

    public ActivityIcon(String kind, int size, Color color) {
        this.kind = kind;
        this.size = size;
        this.color = color;
    }

    @Override
    public void paintIcon(Component c, Graphics g, int x, int y) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        g2.setColor(color);
        g2.setStroke(new BasicStroke(Math.max(2f, size / 10f), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        switch (kind) {
            case MIND_BODY:
                paintPerson(g2, x, y);
                break;
            case DOCTOR:
                paintCross(g2, x, y);
                break;
            case LIBRARY:
                paintBook(g2, x, y);
                break;
            case SHOPPING:
                paintBag(g2, x, y);
                break;
            case PERSON:
                paintSilhouette(g2, x, y);
                break;
            case ARROW_UP:
                paintArrow(g2, x, y, true);
                break;
            case ARROW_DOWN:
                paintArrow(g2, x, y, false);
                break;
            case HEART:
                paintHeart(g2, x, y);
                break;
            case CHAT:
                paintChatBubble(g2, x, y);
                break;
            case BIKE:
                paintBike(g2, x, y);
                break;
            case WALLET:
                paintWallet(g2, x, y);
                break;
            case SUN:
                paintSun(g2, x, y);
                break;
            case FOOTPRINTS:
                paintFootprints(g2, x, y);
                break;
            case SCHOOL_CAP:
                paintCap(g2, x, y);
                break;
            case BRIEFCASE:
                paintBriefcase(g2, x, y);
                break;
            case CAR:
                paintCar(g2, x, y);
                break;
            case INFO:
                paintInfo(g2, x, y);
                break;
            case EXIT:
                paintExit(g2, x, y);
                break;
            default:
                paintBall(g2, x, y);
                break;
        }
        g2.dispose();
    }

    /** Head and shoulders, for a person. */
    private void paintSilhouette(Graphics2D g2, int x, int y) {
        int head = size * 40 / 100;
        g2.fillOval(x + (size - head) / 2, y + 1, head, head);
        g2.fillArc(x + size * 10 / 100, y + size * 50 / 100, size * 80 / 100, size * 80 / 100, 0, 180);
    }

    /** Straight arrow pointing up or down. */
    private void paintArrow(Graphics2D g2, int x, int y, boolean up) {
        int centerX = x + size / 2;
        int top = y + 2;
        int bottom = y + size - 2;
        int tipY = up ? top : bottom;
        int headDirection = up ? 1 : -1;
        g2.drawLine(centerX, top, centerX, bottom);
        g2.drawLine(centerX, tipY, centerX - size * 32 / 100, tipY + headDirection * size * 34 / 100);
        g2.drawLine(centerX, tipY, centerX + size * 32 / 100, tipY + headDirection * size * 34 / 100);
    }

    /** Filled heart: two lobes and a point. */
    private void paintHeart(Graphics2D g2, int x, int y) {
        int lobe = size / 2;
        g2.fillOval(x, y + 2, lobe, lobe);
        g2.fillOval(x + size - lobe, y + 2, lobe, lobe);
        java.awt.Polygon point = new java.awt.Polygon();
        point.addPoint(x + 1, y + 2 + lobe / 2);
        point.addPoint(x + size - 1, y + 2 + lobe / 2);
        point.addPoint(x + size / 2, y + size - 1);
        g2.fillPolygon(point);
    }

    /** Speech bubble with a small tail. */
    private void paintChatBubble(Graphics2D g2, int x, int y) {
        int bubbleHeight = size * 66 / 100;
        g2.drawRoundRect(x + 1, y + 2, size - 2, bubbleHeight, size / 3, size / 3);
        g2.drawLine(x + size * 30 / 100, y + 2 + bubbleHeight, x + size * 22 / 100, y + size - 2);
        g2.drawLine(x + size * 22 / 100, y + size - 2, x + size * 48 / 100, y + 2 + bubbleHeight);
    }

    /** Two wheels joined by a simple frame. */
    private void paintBike(Graphics2D g2, int x, int y) {
        int wheel = size * 42 / 100;
        int wheelY = y + size - wheel - 1;
        g2.drawOval(x + 1, wheelY, wheel, wheel);
        g2.drawOval(x + size - wheel - 1, wheelY, wheel, wheel);
        int leftHub = x + 1 + wheel / 2;
        int rightHub = x + size - 1 - wheel / 2;
        int hubY = wheelY + wheel / 2;
        int seatX = x + size * 38 / 100;
        int seatY = y + size * 30 / 100;
        g2.drawLine(leftHub, hubY, seatX, seatY);
        g2.drawLine(seatX, seatY, rightHub, hubY);
        g2.drawLine(seatX, seatY, x + size * 66 / 100, seatY);
    }

    /** Wallet: rounded rectangle with a clasp on the right. */
    private void paintWallet(Graphics2D g2, int x, int y) {
        int top = y + size * 22 / 100;
        int walletHeight = size * 60 / 100;
        g2.drawRoundRect(x + 1, top, size - 2, walletHeight, 4, 4);
        g2.fillRoundRect(x + size * 60 / 100, top + walletHeight * 35 / 100, size * 32 / 100, walletHeight * 34 / 100, 3, 3);
    }

    /** Sun: a circle with eight short rays, drawn in a loop. */
    private void paintSun(Graphics2D g2, int x, int y) {
        int centerX = x + size / 2;
        int centerY = y + size / 2;
        int core = size * 40 / 100;
        g2.fillOval(centerX - core / 2, centerY - core / 2, core, core);
        double inner = size * 0.34;
        double outer = size * 0.48;
        for (int i = 0; i < 8; i++) {
            double angle = i * Math.PI / 4;
            g2.drawLine((int) Math.round(centerX + inner * Math.cos(angle)), (int) Math.round(centerY + inner * Math.sin(angle)),
                        (int) Math.round(centerX + outer * Math.cos(angle)), (int) Math.round(centerY + outer * Math.sin(angle)));
        }
    }

    /** Graduation cap: filled board with a band and a tassel. */
    private void paintCap(Graphics2D g2, int x, int y) {
        java.awt.Polygon board = new java.awt.Polygon();
        board.addPoint(x + size / 2, y + 2);
        board.addPoint(x + size - 1, y + size * 40 / 100);
        board.addPoint(x + size / 2, y + size * 68 / 100);
        board.addPoint(x + 1, y + size * 40 / 100);
        g2.fillPolygon(board);
        g2.fillArc(x + size * 27 / 100, y + size * 36 / 100, size * 46 / 100, size * 50 / 100, 190, 160);
        g2.drawLine(x + size - 1, y + size * 40 / 100, x + size - 1, y + size * 72 / 100);
    }

    /** Briefcase: outlined body with a handle on top and a clasp line. */
    private void paintBriefcase(Graphics2D g2, int x, int y) {
        int top = y + size * 30 / 100;
        g2.drawRoundRect(x + 1, top, size - 2, size - top + y - 1, 4, 4);
        g2.drawRoundRect(x + size * 32 / 100, y + size * 10 / 100, size * 36 / 100, size * 22 / 100, 3, 3);
        g2.drawLine(x + 1, top + size * 30 / 100, x + size - 1, top + size * 30 / 100);
    }

    /** Side view of a small car: cabin over body, two wheels. */
    private void paintCar(Graphics2D g2, int x, int y) {
        int bodyTop = y + size * 45 / 100;
        int bodyHeight = size * 30 / 100;
        g2.drawRoundRect(x + 1, bodyTop, size - 2, bodyHeight, 4, 4);
        // Cabin: a trapezoid sitting on the body.
        java.awt.Polygon cabin = new java.awt.Polygon();
        cabin.addPoint(x + size * 25 / 100, bodyTop);
        cabin.addPoint(x + size * 36 / 100, y + size * 20 / 100);
        cabin.addPoint(x + size * 68 / 100, y + size * 20 / 100);
        cabin.addPoint(x + size * 80 / 100, bodyTop);
        g2.drawPolygon(cabin);
        int wheel = size * 22 / 100;
        int wheelY = bodyTop + bodyHeight - wheel / 2;
        g2.fillOval(x + size * 18 / 100, wheelY, wheel, wheel);
        g2.fillOval(x + size * 62 / 100, wheelY, wheel, wheel);
    }

    /** Circle with an "i" inside. */
    private void paintInfo(Graphics2D g2, int x, int y) {
        g2.drawOval(x + 1, y + 1, size - 2, size - 2);
        int centerX = x + size / 2;
        g2.fillOval(centerX - 1, y + size * 24 / 100, 3, 3);
        g2.drawLine(centerX, y + size * 46 / 100, centerX, y + size * 74 / 100);
    }

    /** Open door frame with an arrow leading out to the right. */
    private void paintExit(Graphics2D g2, int x, int y) {
        int frameWidth = size * 55 / 100;
        g2.drawRoundRect(x + 1, y + 1, frameWidth, size - 2, 3, 3);
        int arrowY = y + size / 2;
        int arrowStart = x + size * 40 / 100;
        int arrowEnd = x + size - 1;
        g2.drawLine(arrowStart, arrowY, arrowEnd, arrowY);
        g2.drawLine(arrowEnd, arrowY, arrowEnd - size * 22 / 100, arrowY - size * 22 / 100);
        g2.drawLine(arrowEnd, arrowY, arrowEnd - size * 22 / 100, arrowY + size * 22 / 100);
    }

    /** Two footprints, one a little ahead of the other. */
    private void paintFootprints(Graphics2D g2, int x, int y) {
        int footWidth = size * 30 / 100;
        int footHeight = size * 46 / 100;
        g2.fillOval(x + size * 12 / 100, y + size * 44 / 100, footWidth, footHeight);
        g2.fillOval(x + size * 14 / 100, y + size * 30 / 100, footWidth * 2 / 3, footWidth * 2 / 3);
        g2.fillOval(x + size * 58 / 100, y + size * 16 / 100, footWidth, footHeight);
        g2.fillOval(x + size * 60 / 100, y + size * 2 / 100, footWidth * 2 / 3, footWidth * 2 / 3);
    }

    /** Head over open, raised arms: a simple stretching figure. */
    private void paintPerson(Graphics2D g2, int x, int y) {
        int head = size * 26 / 100;
        g2.fillOval(x + (size - head) / 2, y + 1, head, head);
        int centerX = x + size / 2;
        int shoulderY = y + size * 42 / 100;
        g2.drawLine(centerX, shoulderY, centerX, y + size * 78 / 100);            // body
        g2.drawLine(centerX, shoulderY + 2, x + size * 12 / 100, y + size * 26 / 100); // arms up
        g2.drawLine(centerX, shoulderY + 2, x + size * 88 / 100, y + size * 26 / 100);
        g2.drawLine(centerX, y + size * 78 / 100, x + size * 28 / 100, y + size - 1);  // legs
        g2.drawLine(centerX, y + size * 78 / 100, x + size * 72 / 100, y + size - 1);
    }

    /** Medical cross. */
    private void paintCross(Graphics2D g2, int x, int y) {
        int arm = size * 34 / 100;
        int center = size / 2;
        g2.fillRoundRect(x + center - arm / 2, y + 1, arm, size - 2, arm / 2, arm / 2);
        g2.fillRoundRect(x + 1, y + center - arm / 2, size - 2, arm, arm / 2, arm / 2);
    }

    /** Open book: two outlined pages meeting at a spine. */
    private void paintBook(Graphics2D g2, int x, int y) {
        int top = y + size * 18 / 100;
        int bottom = y + size * 84 / 100;
        int mid = x + size / 2;
        int inset = size * 8 / 100;
        g2.drawLine(mid, top + 2, mid, bottom);
        // Left page.
        g2.drawLine(x + inset, top, mid - 1, top + 3);
        g2.drawLine(x + inset, top, x + inset, bottom - 3);
        g2.drawLine(x + inset, bottom - 3, mid - 1, bottom);
        // Right page.
        g2.drawLine(x + size - inset, top, mid + 1, top + 3);
        g2.drawLine(x + size - inset, top, x + size - inset, bottom - 3);
        g2.drawLine(x + size - inset, bottom - 3, mid + 1, bottom);
        // A text line on each page.
        g2.drawLine(x + inset + 4, top + size * 26 / 100, mid - 5, top + size * 28 / 100);
        g2.drawLine(mid + 5, top + size * 28 / 100, x + size - inset - 4, top + size * 26 / 100);
    }

    /** Shopping bag with two handles. */
    private void paintBag(Graphics2D g2, int x, int y) {
        int bagTop = y + size * 34 / 100;
        g2.drawRoundRect(x + size * 12 / 100, bagTop, size * 76 / 100, size * 60 / 100, 4, 4);
        g2.drawArc(x + size * 30 / 100, y + size * 8 / 100, size * 40 / 100, size * 50 / 100, 0, 180);
    }

    /** Ball with a curved seam, for recreation. */
    private void paintBall(Graphics2D g2, int x, int y) {
        g2.drawOval(x + 1, y + 1, size - 2, size - 2);
        g2.drawArc(x + size * 20 / 100, y - size * 10 / 100, size * 60 / 100, size * 120 / 100, 240, 60);
        g2.drawArc(x + size * 20 / 100, y - size * 10 / 100, size * 60 / 100, size * 120 / 100, 60, 60);
    }

    @Override
    public int getIconWidth() {
        return size;
    }

    @Override
    public int getIconHeight() {
        return size;
    }
}
