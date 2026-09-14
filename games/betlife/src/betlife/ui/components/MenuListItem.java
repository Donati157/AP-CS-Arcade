package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.Icon;
import javax.swing.JButton;

import betlife.ui.Theme;

/**
 * One tappable row of a list screen: an icon in a pale circle, a title, an optional
 * subtitle, and a chevron on the right. The row tints on hover and while pressed and
 * ends with a thin divider. It is a JButton, so Enter/Space and focus still work.
 */
public class MenuListItem extends JButton {

    private static final int CHEVRON_SIZE = 8;

    private final Icon icon;
    private final String subtitle;

    public MenuListItem(String title, String subtitle, Icon icon) {
        super(title);
        this.subtitle = subtitle;
        this.icon = icon;
        setActionCommand(title);
        setFocusPainted(false);
        setContentAreaFilled(false);
        setBorderPainted(false);
        setOpaque(false);
        setRolloverEnabled(true);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        setPreferredSize(new Dimension(10, Theme.LIST_ROW_HEIGHT));
        setMaximumSize(new Dimension(Integer.MAX_VALUE, Theme.LIST_ROW_HEIGHT));
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        int width = getWidth();
        int height = getHeight();

        g2.setColor(backgroundColor());
        g2.fillRect(0, 0, width, height);

        // Icon badge (rows without an icon start their text at the left padding).
        int textX = Theme.SCREEN_PADDING;
        if (icon != null) {
            int badge = Theme.LIST_ICON_BADGE;
            int badgeY = (height - badge) / 2;
            g2.setColor(Theme.ICON_BADGE);
            g2.fillOval(textX, badgeY, badge, badge);
            icon.paintIcon(this, g2, textX + (badge - icon.getIconWidth()) / 2,
                    badgeY + (badge - icon.getIconHeight()) / 2);
            textX += badge + Theme.SCREEN_PADDING;
        }

        // Title and subtitle, shortened with "..." if they would run into the chevron.
        int textWidth = width - textX - Theme.SCREEN_PADDING - CHEVRON_SIZE - 10;
        g2.setFont(Theme.ROW_TITLE);
        FontMetrics titleMetrics = g2.getFontMetrics();
        g2.setColor(Theme.PRIMARY_TEXT);
        if (subtitle == null) {
            g2.drawString(shorten(getText(), titleMetrics, textWidth), textX,
                    (height + titleMetrics.getAscent() - titleMetrics.getDescent()) / 2);
        } else {
            g2.setFont(Theme.ROW_SUBTITLE);
            FontMetrics subtitleMetrics = g2.getFontMetrics();
            int block = titleMetrics.getAscent() + 3 + subtitleMetrics.getHeight();
            int titleBaseline = (height - block) / 2 + titleMetrics.getAscent();
            g2.setFont(Theme.ROW_TITLE);
            g2.drawString(shorten(getText(), titleMetrics, textWidth), textX, titleBaseline);
            g2.setFont(Theme.ROW_SUBTITLE);
            g2.setColor(Theme.MUTED_TEXT);
            g2.drawString(shorten(subtitle, subtitleMetrics, textWidth), textX,
                    titleBaseline + 3 + subtitleMetrics.getAscent());
        }

        // Chevron and divider.
        paintChevron(g2, width - Theme.SCREEN_PADDING - CHEVRON_SIZE, height / 2);
        g2.setColor(Theme.DIVIDER);
        g2.fillRect(textX, height - 1, width - textX, 1);
        g2.dispose();
    }

    /** Cuts text down and adds an ellipsis when it does not fit in the given width. */
    private static String shorten(String text, FontMetrics metrics, int maxWidth) {
        if (metrics.stringWidth(text) <= maxWidth) {
            return text;
        }
        String cut = text;
        while (cut.length() > 1 && metrics.stringWidth(cut + "\u2026") > maxWidth) {
            cut = cut.substring(0, cut.length() - 1);
        }
        return cut.trim() + "\u2026";
    }

    private Color backgroundColor() {
        if (getModel().isArmed() && getModel().isPressed()) {
            return Theme.ROW_PRESSED;
        }
        if (getModel().isRollover()) {
            return Theme.ROW_HOVER;
        }
        return Theme.BACKGROUND;
    }

    private static void paintChevron(Graphics2D g2, int x, int centerY) {
        g2.setColor(Theme.MUTED_TEXT);
        g2.setStroke(new BasicStroke(2f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g2.drawLine(x, centerY - CHEVRON_SIZE / 2 - 1, x + CHEVRON_SIZE / 2, centerY);
        g2.drawLine(x + CHEVRON_SIZE / 2, centerY, x, centerY + CHEVRON_SIZE / 2 + 1);
    }
}
