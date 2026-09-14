package betlife.ui.components;

import java.awt.Dimension;

import javax.swing.BorderFactory;
import javax.swing.JLabel;

import betlife.ui.Theme;

/**
 * Small muted uppercase heading that separates groups of rows on a screen ("ACTIONS").
 */
public class SectionLabel extends JLabel {

    public SectionLabel(String text) {
        super(text.toUpperCase());
        setFont(Theme.CAPTION);
        setForeground(Theme.MUTED_TEXT);
        setBorder(BorderFactory.createEmptyBorder(16, Theme.SCREEN_PADDING, 4, Theme.SCREEN_PADDING));
        setAlignmentX(LEFT_ALIGNMENT);
        setMaximumSize(new Dimension(Integer.MAX_VALUE, getPreferredSize().height));
    }
}
