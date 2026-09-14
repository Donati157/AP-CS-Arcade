package betlife.ui.components;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.event.ActionListener;

import javax.swing.Box;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

import betlife.ui.Theme;

/**
 * Red bar at the top of every BetLife screen: a control on the left, a centered title,
 * and an equally wide empty region on the right so the title is centered in the window.
 *
 * Secondary screens use {@link #ScreenHeader(String, ActionListener)} to get a back arrow
 * and an uppercase title. The main screen passes its own controls to the other constructor.
 */
public class ScreenHeader extends JPanel {

    private JLabel titleLabel;

    /** Header with a back arrow on the left and a plain text title. */
    public ScreenHeader(String title, ActionListener backAction) {
        this(createBackButton(backAction), createTitle(title));
        titleLabel = (JLabel) getComponent(1);
    }

    /** Header built from a custom left control and a custom center component. */
    public ScreenHeader(JComponent leftControl, JComponent center) {
        super(new BorderLayout());
        setBackground(Theme.HEADER_RED);
        setPreferredSize(new Dimension(10, Theme.HEADER_HEIGHT));
        add(leftControl, BorderLayout.WEST);
        add(center, BorderLayout.CENTER);
        add(Box.createHorizontalStrut(Theme.HEADER_SIDE_WIDTH), BorderLayout.EAST);
    }

    /** Changes the title; only for headers created with a text title. */
    public void setTitle(String title) {
        titleLabel.setText(title.toUpperCase());
    }

    private static HeaderIconButton createBackButton(ActionListener backAction) {
        HeaderIconButton back = new HeaderIconButton(HeaderIconButton.BACK, "Back");
        back.addActionListener(backAction);
        return back;
    }

    private static JLabel createTitle(String title) {
        JLabel label = new JLabel(title.toUpperCase(), SwingConstants.CENTER);
        label.setFont(Theme.SCREEN_TITLE);
        label.setForeground(Theme.ON_DARK);
        return label;
    }
}
