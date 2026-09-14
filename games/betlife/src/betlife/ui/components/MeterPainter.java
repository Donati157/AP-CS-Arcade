package betlife.ui.components;

import java.awt.Graphics2D;

import betlife.model.Player;
import betlife.ui.Theme;

/**
 * Draws the thin rounded BetLife meter: a grey track with a green fill proportional
 * to a 0-100 value. Shared by every component that shows a percentage bar.
 */
public final class MeterPainter {

    private MeterPainter() {
        // Static helper only.
    }

    public static void paint(Graphics2D g2, int x, int y, int width, int height, int value) {
        g2.setColor(Theme.STAT_TRACK);
        g2.fillRoundRect(x, y, width, height, height, height);
        int fillWidth = width * value / Player.MAX_STAT;
        if (fillWidth > 0) {
            g2.setColor(Theme.STAT_FILL);
            g2.fillRoundRect(x, y, fillWidth, height, height, height);
        }
    }
}
