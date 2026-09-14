package betlife.ui.components;

import java.awt.Color;
import java.awt.Cursor;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.JButton;

import betlife.ui.Theme;

/**
 * One side item of the navigation bar: an icon inside a translucent circle
 * with a small label underneath. Painted by hand so it does not look like a desktop button.
 */
public class NavItemButton extends JButton {

    private NavIcon icon;

    public NavItemButton(String name, String iconKind) {
        super(name);
        this.icon = new NavIcon(iconKind);
        setActionCommand(name);
        setFont(Theme.NAV_LABEL);
        setForeground(Theme.ON_DARK);
        setFocusPainted(false);
        setContentAreaFilled(false);
        setBorderPainted(false);
        setOpaque(false);
        setRolloverEnabled(true);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
    }

    /** Changes what this item stands for, e.g. School becoming Career once the player works. */
    public void setItem(String name, String iconKind) {
        setText(name);
        setActionCommand(name);
        icon = new NavIcon(iconKind);
        repaint();
    }

    /** The circle behind the icon brightens on hover and more while pressed. */
    private Color ringColor() {
        if (getModel().isArmed() && getModel().isPressed()) {
            return Theme.NAV_ICON_PRESSED;
        }
        if (getModel().isRollover()) {
            return Theme.NAV_ICON_HOVER;
        }
        return Theme.NAV_ICON_BACKGROUND;
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        int ring = Theme.NAV_ICON_RING;
        int labelHeight = g2.getFontMetrics(getFont()).getHeight();
        int contentHeight = ring + 3 + labelHeight;
        int top = (getHeight() - contentHeight) / 2;
        int ringX = (getWidth() - ring) / 2;

        g2.setColor(ringColor());
        g2.fillOval(ringX, top, ring, ring);
        icon.paintIcon(this, g2, ringX + (ring - icon.getIconWidth()) / 2,
                top + (ring - icon.getIconHeight()) / 2);

        g2.setFont(getFont());
        g2.setColor(getForeground());
        FontMetrics metrics = g2.getFontMetrics();
        int labelX = (getWidth() - metrics.stringWidth(getText())) / 2;
        int labelY = top + ring + 3 + metrics.getAscent();
        g2.drawString(getText(), labelX, labelY);
        g2.dispose();
    }
}
