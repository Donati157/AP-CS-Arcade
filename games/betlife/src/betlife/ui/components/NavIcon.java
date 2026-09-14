package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Component;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Polygon;
import java.awt.RenderingHints;
import java.awt.geom.Path2D;

import javax.swing.Icon;

import betlife.ui.Theme;

/**
 * Small original outline icons for the navigation bar, drawn with a shared line weight
 * so the four items look like one set. The kind is one of the constants below.
 */
public class NavIcon implements Icon {

    public static final String SCHOOL = "school";
    public static final String ASSETS = "assets";
    public static final String RELATIONSHIPS = "relationships";
    public static final String ACTIVITIES = "activities";
    public static final String CAREER = "career";

    private static final float LINE_WIDTH = 2f;

    private final String kind;
    private final int size;

    public NavIcon(String kind) {
        this.kind = kind;
        this.size = Theme.NAV_ICON_SIZE;
    }

    @Override
    public void paintIcon(Component c, Graphics g, int x, int y) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        g2.setColor(Theme.ON_DARK);
        g2.setStroke(new BasicStroke(LINE_WIDTH, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        switch (kind) {
            case SCHOOL:
                paintGraduationCap(g2, x, y);
                break;
            case ASSETS:
                paintHouse(g2, x, y);
                break;
            case RELATIONSHIPS:
                paintTwoPeople(g2, x, y);
                break;
            case CAREER:
                paintBriefcase(g2, x, y);
                break;
            default:
                paintStar(g2, x, y);
                break;
        }
        g2.dispose();
    }

    /** Filled mortarboard with an outlined band underneath and a tassel on the right. */
    private void paintGraduationCap(Graphics2D g2, int x, int y) {
        Polygon board = new Polygon();
        board.addPoint(x + size / 2, y + 2);
        board.addPoint(x + size - 1, y + size * 40 / 100);
        board.addPoint(x + size / 2, y + size * 68 / 100);
        board.addPoint(x + 1, y + size * 40 / 100);
        g2.fillPolygon(board);
        // Cloth part: a filled band hanging under the board, so the shape reads as a cap.
        g2.fillArc(x + size * 27 / 100, y + size * 36 / 100, size * 46 / 100, size * 50 / 100, 190, 160);
        // Tassel.
        g2.drawLine(x + size - 1, y + size * 40 / 100, x + size - 1, y + size * 72 / 100);
    }

    /** Outlined house with a small filled door. */
    private void paintHouse(Graphics2D g2, int x, int y) {
        Path2D house = new Path2D.Float();
        house.moveTo(x + 2, y + size * 50 / 100);
        house.lineTo(x + size / 2.0, y + 2);
        house.lineTo(x + size - 2, y + size * 50 / 100);
        house.lineTo(x + size - 4, y + size * 50 / 100);
        house.lineTo(x + size - 4, y + size - 2);
        house.lineTo(x + 4, y + size - 2);
        house.lineTo(x + 4, y + size * 50 / 100);
        house.closePath();
        g2.draw(house);
        g2.fillRect(x + size * 40 / 100, y + size * 62 / 100, size * 20 / 100, size * 32 / 100);
    }

    /** Two people side by side: filled heads over outlined shoulders. */
    private void paintTwoPeople(Graphics2D g2, int x, int y) {
        int head = size * 32 / 100;
        int leftX = x + size * 12 / 100;
        int rightX = x + size * 56 / 100;
        int headY = y + 1;
        g2.fillOval(leftX, headY, head, head);
        g2.fillOval(rightX, headY, head, head);
        int shouldersY = y + size * 52 / 100;
        int shouldersWidth = size * 44 / 100;
        g2.drawArc(leftX - size * 6 / 100, shouldersY, shouldersWidth, size * 46 / 100, 0, 180);
        g2.drawArc(rightX - size * 6 / 100, shouldersY, shouldersWidth, size * 46 / 100, 0, 180);
    }

    /** Briefcase: outlined body with a handle on top and a clasp line. */
    private void paintBriefcase(Graphics2D g2, int x, int y) {
        int top = y + size * 30 / 100;
        g2.drawRoundRect(x + 1, top, size - 2, size - top + y - 1, 4, 4);
        g2.drawRoundRect(x + size * 32 / 100, y + size * 10 / 100, size * 36 / 100, size * 22 / 100, 3, 3);
        g2.drawLine(x + 1, top + size * 30 / 100, x + size - 1, top + size * 30 / 100);
    }

    /** Outlined five-pointed star built by alternating outer and inner points around a circle. */
    private void paintStar(Graphics2D g2, int x, int y) {
        int centerX = x + size / 2;
        int centerY = y + size / 2 + 1;
        double outer = size / 2.0 - 1;
        double inner = outer * 0.48;
        Polygon star = new Polygon();
        for (int i = 0; i < 10; i++) {
            double radius = (i % 2 == 0) ? outer : inner;
            double angle = Math.PI / 2 + i * Math.PI / 5;
            star.addPoint((int) Math.round(centerX + radius * Math.cos(angle)),
                          (int) Math.round(centerY - radius * Math.sin(angle)));
        }
        g2.drawPolygon(star);
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
