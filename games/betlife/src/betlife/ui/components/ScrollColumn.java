package betlife.ui.components;

import java.awt.Dimension;
import java.awt.Rectangle;

import javax.swing.BoxLayout;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.Scrollable;

import betlife.ui.Theme;

/**
 * A vertical column of components meant to live inside a scroll pane.
 * It always matches the viewport width, so text inside wraps instead of
 * forcing a horizontal scrollbar. Used by the life journal and by list screens.
 */
public class ScrollColumn extends JPanel implements Scrollable {

    private static final int SCROLL_STEP = 14;

    public ScrollColumn() {
        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
        setBackground(Theme.BACKGROUND);
    }

    /** Wraps this column in a scroll pane styled the BetLife way (thin bar, no border). */
    public JScrollPane createScrollPane() {
        JScrollPane scrollPane = new JScrollPane(this);
        scrollPane.setBorder(null);
        scrollPane.getViewport().setBackground(Theme.BACKGROUND);
        scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        scrollPane.getVerticalScrollBar().setUnitIncrement(SCROLL_STEP);
        scrollPane.getVerticalScrollBar().setUI(new SlimScrollBarUI());
        scrollPane.getVerticalScrollBar().setPreferredSize(
                new Dimension(SlimScrollBarUI.WIDTH, Integer.MAX_VALUE));
        return scrollPane;
    }

    @Override
    public Dimension getPreferredScrollableViewportSize() {
        return getPreferredSize();
    }

    @Override
    public int getScrollableUnitIncrement(Rectangle visibleRect, int orientation, int direction) {
        return SCROLL_STEP;
    }

    @Override
    public int getScrollableBlockIncrement(Rectangle visibleRect, int orientation, int direction) {
        return visibleRect.height;
    }

    @Override
    public boolean getScrollableTracksViewportWidth() {
        return true;
    }

    @Override
    public boolean getScrollableTracksViewportHeight() {
        return false;
    }
}
