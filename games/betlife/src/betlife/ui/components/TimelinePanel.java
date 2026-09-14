package betlife.ui.components;

import java.awt.BorderLayout;
import java.util.List;

import javax.swing.BorderFactory;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.SwingUtilities;

import betlife.model.LifeEvent;
import betlife.ui.Theme;

/**
 * The life journal: a flat white, vertically scrollable column of
 * {@link TimelineEntryPanel}s built from the game's event list.
 * {@link #showEvents(List)} rebuilds the column so it always mirrors the model exactly,
 * then scrolls to the newest event.
 */
public class TimelinePanel extends JPanel {

    private static final int NO_AGE_YET = -1;

    private final ScrollColumn entries = new ScrollColumn();
    private final JScrollPane scrollPane;

    public TimelinePanel() {
        super(new BorderLayout());
        setBackground(Theme.BACKGROUND);
        // Extra room at the bottom lets the newest entry scroll clear of the raised Age button.
        entries.setBorder(BorderFactory.createEmptyBorder(
                4, Theme.SCREEN_PADDING, Theme.AGE_BUTTON_RISE + 8, Theme.SCREEN_PADDING));
        scrollPane = entries.createScrollPane();
        add(scrollPane, BorderLayout.CENTER);
    }

    /**
     * Replaces the journal contents with the given events, oldest first.
     * The age heading is only shown when the year changes, so consecutive events
     * of the same year are grouped under one heading.
     */
    public void showEvents(List<LifeEvent> events) {
        entries.removeAll();
        int lastAgeShown = NO_AGE_YET;
        for (LifeEvent event : events) {
            boolean newYear = event.getAge() != lastAgeShown;
            lastAgeShown = event.getAge();
            entries.add(new TimelineEntryPanel(event, newYear));
        }
        entries.revalidate();
        entries.repaint();
        SwingUtilities.invokeLater(this::scrollToBottom);
    }

    public int getEntryCount() {
        return entries.getComponentCount();
    }

    private void scrollToBottom() {
        scrollPane.getVerticalScrollBar().setValue(scrollPane.getVerticalScrollBar().getMaximum());
    }
}
