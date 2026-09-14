package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Polygon;
import java.awt.RenderingHints;

import javax.swing.Icon;

/**
 * Small original symbols that identify each stat row: smile, heart, lightbulb, sparkle.
 * Each is drawn in the stat's own color at a fixed small size.
 */
public class StatIcon implements Icon {

    public static final String SMILE = "smile";
    public static final String HEART = "heart";
    public static final String LIGHTBULB = "lightbulb";
    public static final String SPARKLE = "sparkle";

    private static final int SIZE = 14;

    private final String kind;
    private final Color color;

    public StatIcon(String kind, Color color) {
        this.kind = kind;
        this.color = color;
    }

    @Override
    public void paintIcon(Component c, Graphics g, int x, int y) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        g2.setColor(color);
        g2.setStroke(new BasicStroke(1.6f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        switch (kind) {
            case SMILE:
                paintSmile(g2, x, y);
                break;
            case HEART:
                paintHeart(g2, x, y);
                break;
            case LIGHTBULB:
                paintLightbulb(g2, x, y);
                break;
            default:
                paintSparkle(g2, x, y);
                break;
        }
        g2.dispose();
    }

    private void paintSmile(Graphics2D g2, int x, int y) {
        g2.drawOval(x + 1, y + 1, SIZE - 2, SIZE - 2);
        g2.fillOval(x + 4, y + 5, 2, 2);
        g2.fillOval(x + SIZE - 6, y + 5, 2, 2);
        g2.drawArc(x + 4, y + 5, SIZE - 8, SIZE - 9, 200, 140);
    }

    private void paintHeart(Graphics2D g2, int x, int y) {
        int lobe = SIZE / 2;
        g2.fillOval(x, y + 1, lobe, lobe);
        g2.fillOval(x + SIZE - lobe, y + 1, lobe, lobe);
        Polygon point = new Polygon();
        point.addPoint(x + 1, y + 1 + lobe / 2);
        point.addPoint(x + SIZE - 1, y + 1 + lobe / 2);
        point.addPoint(x + SIZE / 2, y + SIZE - 1);
        g2.fillPolygon(point);
    }

    /** Outlined glass bulb with a short filament and a filled screw base. */
    private void paintLightbulb(Graphics2D g2, int x, int y) {
        int bulb = SIZE * 72 / 100;
        int bulbX = x + (SIZE - bulb) / 2;
        g2.drawOval(bulbX, y, bulb, bulb);
        g2.drawLine(x + SIZE / 2, y + bulb * 45 / 100, x + SIZE / 2, y + bulb);
        g2.fillRoundRect(x + SIZE / 2 - 3, y + bulb + 1, 6, 3, 2, 2);
    }

    /** Four-pointed sparkle: a diamond pinched toward its center. */
    private void paintSparkle(Graphics2D g2, int x, int y) {
        int centerX = x + SIZE / 2;
        int centerY = y + SIZE / 2;
        int reach = SIZE / 2;
        int pinch = SIZE / 7;
        Polygon sparkle = new Polygon();
        sparkle.addPoint(centerX, centerY - reach);
        sparkle.addPoint(centerX + pinch, centerY - pinch);
        sparkle.addPoint(centerX + reach, centerY);
        sparkle.addPoint(centerX + pinch, centerY + pinch);
        sparkle.addPoint(centerX, centerY + reach);
        sparkle.addPoint(centerX - pinch, centerY + pinch);
        sparkle.addPoint(centerX - reach, centerY);
        sparkle.addPoint(centerX - pinch, centerY - pinch);
        g2.fillPolygon(sparkle);
    }

    @Override
    public int getIconWidth() {
        return SIZE;
    }

    @Override
    public int getIconHeight() {
        return SIZE;
    }
}
