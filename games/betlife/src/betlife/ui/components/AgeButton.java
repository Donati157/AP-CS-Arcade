package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.JButton;

import betlife.ui.Theme;

/**
 * The big round green "+ Age" button in the middle of the navigation bar.
 * Everything is painted by hand: green body, white ring, a large plus and the label.
 * The body brightens on hover and darkens while pressed.
 */
public class AgeButton extends JButton {

    private static final int RING_WIDTH = 4;
    private static final int SHADOW_OFFSET = 3;

    public AgeButton() {
        setPreferredSize(new Dimension(Theme.AGE_BUTTON_SIZE, Theme.AGE_BUTTON_SIZE));
        setFocusPainted(false);
        setContentAreaFilled(false);
        setBorderPainted(false);
        setOpaque(false);
        setRolloverEnabled(true);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        setToolTipText("Age one year");
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        int size = Math.min(getWidth(), getHeight()) - SHADOW_OFFSET;
        int x = (getWidth() - size) / 2;
        int y = (getHeight() - size - SHADOW_OFFSET) / 2;
        boolean pressed = getModel().isArmed() && getModel().isPressed();

        // Soft shadow underneath gives the button a raised look; it disappears while pressed.
        if (!pressed) {
            g2.setColor(Theme.AGE_SHADOW);
            g2.fillOval(x, y + SHADOW_OFFSET, size, size);
        } else {
            y += SHADOW_OFFSET;
        }

        g2.setColor(bodyColor(pressed));
        g2.fillOval(x, y, size, size);

        // White ring just inside the edge makes the button stand out from the blue bar.
        g2.setColor(Theme.ON_DARK);
        g2.setStroke(new BasicStroke(RING_WIDTH));
        int inset = RING_WIDTH / 2 + 2;
        g2.drawOval(x + inset, y + inset, size - 2 * inset, size - 2 * inset);

        // Plus above the label, the pair centered a little above the middle of the circle.
        drawCenteredText(g2, "+", Theme.AGE_PLUS, y + size * 40 / 100);
        drawCenteredText(g2, "Age", Theme.AGE_LABEL, y + size * 70 / 100);
        g2.dispose();
    }

    private Color bodyColor(boolean pressed) {
        if (pressed) {
            return Theme.AGE_GREEN_PRESSED;
        }
        if (getModel().isRollover()) {
            return Theme.AGE_GREEN_HOVER;
        }
        return Theme.AGE_GREEN;
    }

    /** Draws text horizontally centered with its vertical middle at centerY. */
    private void drawCenteredText(Graphics2D g2, String text, Font font, int centerY) {
        g2.setFont(font);
        FontMetrics metrics = g2.getFontMetrics();
        int textX = (getWidth() - metrics.stringWidth(text)) / 2;
        int textY = centerY + (metrics.getAscent() - metrics.getDescent()) / 2;
        g2.drawString(text, textX, textY);
    }

    /** Only the circle reacts to clicks, not the square corners around it. */
    @Override
    public boolean contains(int px, int py) {
        double radius = Math.min(getWidth(), getHeight()) / 2.0;
        double dx = px - getWidth() / 2.0;
        double dy = py - getHeight() / 2.0;
        return dx * dx + dy * dy <= radius * radius;
    }
}
