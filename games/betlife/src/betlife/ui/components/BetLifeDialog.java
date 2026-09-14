package betlife.ui.components;

import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Window;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;

import javax.swing.AbstractAction;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextArea;
import javax.swing.KeyStroke;
import javax.swing.SwingUtilities;

import betlife.ui.Theme;

/**
 * Small BetLife-styled modal message: a title, a short message and one green button.
 * Used for activity feedback instead of the default system dialog. Enter or Escape closes it, like the button does.
 */
public class BetLifeDialog extends JDialog {

    private static final int WIDTH = 320;

    private BetLifeDialog(Window owner, String title, String message, String buttonText) {
        super(owner, ModalityType.APPLICATION_MODAL);
        setUndecorated(true);

        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(Theme.PAGE_TITLE);
        titleLabel.setForeground(Theme.PLAYER_NAME_TEAL);
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);

        JTextArea messageArea = new JTextArea(message);
        messageArea.setFont(Theme.BODY);
        messageArea.setForeground(Theme.SECONDARY_TEXT);
        messageArea.setLineWrap(true);
        messageArea.setWrapStyleWord(true);
        messageArea.setEditable(false);
        messageArea.setFocusable(false);
        messageArea.setOpaque(false);
        messageArea.setAlignmentX(Component.CENTER_ALIGNMENT);
        messageArea.setMaximumSize(new Dimension(WIDTH - 48, Integer.MAX_VALUE));

        ActionButton button = new ActionButton(buttonText);
        button.setAlignmentX(Component.CENTER_ALIGNMENT);
        button.addActionListener(e -> dispose());

        JPanel content = new JPanel();
        content.setLayout(new BoxLayout(content, BoxLayout.Y_AXIS));
        content.setBackground(Theme.BACKGROUND);
        content.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Theme.DIVIDER),
                BorderFactory.createEmptyBorder(22, 24, 20, 24)));
        content.add(titleLabel);
        content.add(Box.createVerticalStrut(10));
        content.add(messageArea);
        content.add(Box.createVerticalStrut(18));
        content.add(button);

        // Enter and Escape behave like the button.
        content.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW)
                .put(KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0), "close");
        content.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW)
                .put(KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0), "close");
        content.getActionMap().put("close", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                dispose();
            }
        });

        getContentPane().setLayout(new BorderLayout());
        getContentPane().add(content, BorderLayout.CENTER);
        pack();
        setSize(WIDTH, getHeight());
        setLocationRelativeTo(owner);
    }

    /** Shows the dialog centered over the window that contains {@code parent} and waits until it closes. */
    public static void show(Component parent, String title, String message, String buttonText) {
        Window owner = SwingUtilities.getWindowAncestor(parent);
        new BetLifeDialog(owner, title, message, buttonText).setVisible(true);
    }
}
