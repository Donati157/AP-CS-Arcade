package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;

import javax.swing.JComponent;

import betlife.ui.Theme;

/**
 * Original avatar drawn with simple shapes: a round badge holding a
 * cartoon head with hair, eyes and a smile above a green shirt.
 */
public class Avatar extends JComponent {

    public Avatar() {
        setPreferredSize(new Dimension(Theme.AVATAR_SIZE, Theme.AVATAR_SIZE));
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        int size = Math.min(getWidth(), getHeight());
        int x = (getWidth() - size) / 2;
        int y = (getHeight() - size) / 2;

        // Round badge; everything below is clipped inside it.
        g2.setColor(Theme.AVATAR_BACKGROUND);
        g2.fillOval(x, y, size, size);
        g2.setClip(new Ellipse2D.Float(x, y, size, size));

        // Shirt: a wide oval peeking up from the bottom of the badge.
        g2.setColor(Theme.AVATAR_SHIRT);
        g2.fillOval(x + size / 8, y + size * 72 / 100, size * 3 / 4, size / 2);

        // Head.
        int headSize = size * 56 / 100;
        int headX = x + (size - headSize) / 2;
        int headY = y + size * 18 / 100;
        g2.setColor(Theme.AVATAR_SKIN);
        g2.fillOval(headX, headY, headSize, headSize);

        // Hair: the top of the head.
        g2.setColor(Theme.AVATAR_HAIR);
        g2.fillArc(headX - 1, headY - 1, headSize + 2, headSize + 2, 10, 160);

        // Eyes and smile.
        g2.setColor(Theme.PRIMARY_TEXT);
        int eye = Math.max(2, headSize / 9);
        g2.fillOval(headX + headSize * 30 / 100, headY + headSize * 48 / 100, eye, eye);
        g2.fillOval(headX + headSize * 62 / 100, headY + headSize * 48 / 100, eye, eye);
        g2.setStroke(new BasicStroke(1.6f));
        g2.drawArc(headX + headSize * 32 / 100, headY + headSize * 52 / 100,
                headSize * 36 / 100, headSize * 26 / 100, 200, 140);

        g2.dispose();
    }
}
