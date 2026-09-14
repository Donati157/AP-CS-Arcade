package betlife.ui.components;

import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.BorderFactory;
import javax.swing.Icon;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextArea;

import betlife.model.LifeEvent;
import betlife.ui.Theme;

/**
 * One journal entry in the timeline: the event text, with an "Age: N years" heading
 * above it when this is the first event of that year. Several events in the same year
 * therefore read as one group under a single heading.
 * The text wraps to the width of the timeline, so long events display correctly.
 */
public class TimelineEntryPanel extends JPanel {

    private static final int MARKER_SIZE = 6;
    private static final int MARKER_GAP = 6;
    /** Event text lines up with the heading text, just past the year marker. */
    private static final int BODY_INDENT = MARKER_SIZE + MARKER_GAP;

    public TimelineEntryPanel(LifeEvent event, boolean showAgeHeading) {
        super(new BorderLayout(0, 2));
        setOpaque(false);
        int topGap = showAgeHeading ? 8 : 1;
        setBorder(BorderFactory.createEmptyBorder(topGap, 0, 4, 0));

        if (showAgeHeading) {
            JLabel ageLabel = new JLabel(formatAge(event.getAge()), new YearMarker(), JLabel.LEFT);
            ageLabel.setIconTextGap(MARKER_GAP);
            ageLabel.setFont(Theme.TIMELINE_AGE);
            ageLabel.setForeground(Theme.AGE_TEXT_TEAL);
            add(ageLabel, BorderLayout.NORTH);
        }

        JTextArea text = new JTextArea(event.getDescription());
        text.setFont(event.getKind() == LifeEvent.Kind.MILESTONE ? Theme.TIMELINE_MILESTONE : Theme.TIMELINE_TEXT);
        text.setForeground(textColor(event.getKind()));
        text.setLineWrap(true);
        text.setWrapStyleWord(true);
        text.setEditable(false);
        text.setFocusable(false);
        text.setOpaque(false);
        text.setBorder(BorderFactory.createEmptyBorder(0, BODY_INDENT, 0, 0));

        add(text, BorderLayout.CENTER);
    }

    /** Milestones are blue, good news teal-green, everything else the usual gray. */
    private static java.awt.Color textColor(LifeEvent.Kind kind) {
        switch (kind) {
            case MILESTONE:
                return Theme.NAV_BLUE;
            case POSITIVE:
                return Theme.POSITIVE_TEXT;
            default:
                return Theme.SECONDARY_TEXT;
        }
    }

    private static String formatAge(int age) {
        return "Age: " + age + (age == 1 ? " year" : " years");
    }

    /** Small teal dot that marks the start of each year in the journal. */
    private static class YearMarker implements Icon {

        @Override
        public void paintIcon(Component c, Graphics g, int x, int y) {
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2.setColor(Theme.AGE_TEXT_TEAL);
            g2.fillOval(x, y, MARKER_SIZE, MARKER_SIZE);
            g2.dispose();
        }

        @Override
        public int getIconWidth() {
            return MARKER_SIZE;
        }

        @Override
        public int getIconHeight() {
            return MARKER_SIZE;
        }
    }
}
