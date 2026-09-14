package betlife.ui.components;

import java.awt.Color;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.JButton;

import betlife.ui.Theme;

/**
 * Wide rounded green button for a screen's primary action ("Read a Book", "Continue").
 * Painted by hand with hover and pressed shades; still a normal JButton for keyboard use.
 */
public class ActionButton extends JButton {

    private static final int RADIUS = 12;

    public ActionButton(String text) {
        super(text);
        setFont(Theme.ACTION_BUTTON);
        setForeground(Theme.ON_DARK);
        setFocusPainted(false);
        setContentAreaFilled(false);
        setBorderPainted(false);
        setOpaque(false);
        setRolloverEnabled(true);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        setPreferredSize(new Dimension(220, Theme.ACTION_BUTTON_HEIGHT));
        setMaximumSize(new Dimension(320, Theme.ACTION_BUTTON_HEIGHT));
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2.setColor(bodyColor());
        g2.fillRoundRect(0, 0, getWidth(), getHeight(), RADIUS, RADIUS);

        g2.setFont(getFont());
        g2.setColor(getForeground());
        FontMetrics metrics = g2.getFontMetrics();
        int textX = (getWidth() - metrics.stringWidth(getText())) / 2;
        int textY = (getHeight() + metrics.getAscent() - metrics.getDescent()) / 2;
        g2.drawString(getText(), textX, textY);
        g2.dispose();
    }

    private Color bodyColor() {
        if (getModel().isArmed() && getModel().isPressed()) {
            return Theme.AGE_GREEN_PRESSED;
        }
        if (getModel().isRollover()) {
            return Theme.AGE_GREEN_HOVER;
        }
        return Theme.AGE_GREEN;
    }
}
