package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.JButton;

import betlife.ui.Theme;

/**
 * Flat icon button that sits at the side of a screen header. The icon is drawn by hand
 * (menu bars or a back arrow) and a translucent circle appears behind it on hover.
 */
public class HeaderIconButton extends JButton {

    public static final String MENU = "menu";
    public static final String BACK = "back";

    private static final int ICON_SIZE = 20;
    private static final int HOVER_RING = 36;

    private final String kind;

    public HeaderIconButton(String kind, String tooltip) {
        this.kind = kind;
        setPreferredSize(new Dimension(Theme.HEADER_SIDE_WIDTH, Theme.HEADER_HEIGHT));
        setFocusPainted(false);
        setContentAreaFilled(false);
        setBorderPainted(false);
        setOpaque(false);
        setRolloverEnabled(true);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        setToolTipText(tooltip);
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        int centerX = getWidth() / 2;
        int centerY = getHeight() / 2;

        if (getModel().isArmed() && getModel().isPressed()) {
            g2.setColor(Theme.NAV_ICON_PRESSED);
            g2.fillOval(centerX - HOVER_RING / 2, centerY - HOVER_RING / 2, HOVER_RING, HOVER_RING);
        } else if (getModel().isRollover()) {
            g2.setColor(Theme.NAV_ICON_HOVER);
            g2.fillOval(centerX - HOVER_RING / 2, centerY - HOVER_RING / 2, HOVER_RING, HOVER_RING);
        }

        g2.setColor(Theme.ON_DARK);
        int x = centerX - ICON_SIZE / 2;
        int y = centerY - ICON_SIZE / 2;
        if (MENU.equals(kind)) {
            paintMenuBars(g2, x, y);
        } else {
            paintBackArrow(g2, x, y);
        }
        g2.dispose();
    }

    /** Three short horizontal bars. */
    private static void paintMenuBars(Graphics2D g2, int x, int y) {
        int barHeight = 3;
        int gap = (ICON_SIZE - 3 * barHeight) / 2;
        for (int i = 0; i < 3; i++) {
            int barY = y + i * (barHeight + gap);
            g2.fillRoundRect(x, barY, ICON_SIZE, barHeight, barHeight, barHeight);
        }
    }

    /** Chevron pointing left with a stem, drawn with round line ends. */
    private static void paintBackArrow(Graphics2D g2, int x, int y) {
        g2.setStroke(new BasicStroke(2.6f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        int midY = y + ICON_SIZE / 2;
        int tipX = x + 3;
        g2.drawLine(tipX, midY, x + ICON_SIZE - 3, midY);
        g2.drawLine(tipX, midY, tipX + 7, midY - 7);
        g2.drawLine(tipX, midY, tipX + 7, midY + 7);
    }
}
