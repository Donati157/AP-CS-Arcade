package betlife.ui.components;

import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Window;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;

import betlife.game.Choice;
import betlife.game.Decision;
import betlife.ui.Theme;

/**
 * BetLife-styled modal question: a title, a description and one button per choice.
 * The dialog cannot be dismissed without choosing, so every decision gets an answer.
 */
public class DecisionDialog extends JDialog {

    private static final int WIDTH = 340;

    private int chosenIndex = -1;

    private DecisionDialog(Window owner, Decision decision) {
        super(owner, ModalityType.APPLICATION_MODAL);
        setUndecorated(true);
        setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);

        JLabel titleLabel = new JLabel(decision.getTitle());
        titleLabel.setFont(Theme.PAGE_TITLE);
        titleLabel.setForeground(Theme.PLAYER_NAME_TEAL);
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);

        JTextArea description = new JTextArea(decision.getDescription());
        description.setFont(Theme.BODY);
        description.setForeground(Theme.SECONDARY_TEXT);
        description.setLineWrap(true);
        description.setWrapStyleWord(true);
        description.setEditable(false);
        description.setFocusable(false);
        description.setOpaque(false);
        description.setAlignmentX(Component.CENTER_ALIGNMENT);
        description.setMaximumSize(new Dimension(WIDTH - 48, Integer.MAX_VALUE));

        JPanel content = new JPanel();
        content.setLayout(new BoxLayout(content, BoxLayout.Y_AXIS));
        content.setBackground(Theme.BACKGROUND);
        content.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Theme.DIVIDER),
                BorderFactory.createEmptyBorder(22, 24, 20, 24)));
        content.add(titleLabel);
        content.add(Box.createVerticalStrut(10));
        content.add(description);
        content.add(Box.createVerticalStrut(18));

        for (int i = 0; i < decision.getChoices().size(); i++) {
            Choice choice = decision.getChoices().get(i);
            ActionButton button = new ActionButton(choice.getLabel());
            button.setAlignmentX(Component.CENTER_ALIGNMENT);
            button.setMaximumSize(new Dimension(WIDTH - 48, Theme.ACTION_BUTTON_HEIGHT));
            final int index = i;
            button.addActionListener(e -> {
                chosenIndex = index;
                dispose();
            });
            content.add(button);
            content.add(Box.createVerticalStrut(8));
        }

        getContentPane().setLayout(new BorderLayout());
        getContentPane().add(content, BorderLayout.CENTER);
        pack();
        setSize(WIDTH, getHeight());
        setLocationRelativeTo(owner);
    }

    /** Shows the decision over the window containing {@code parent} and returns the chosen index. */
    public static int show(Component parent, Decision decision) {
        Window owner = SwingUtilities.getWindowAncestor(parent);
        DecisionDialog dialog = new DecisionDialog(owner, decision);
        dialog.setVisible(true);
        return dialog.chosenIndex;
    }
}
