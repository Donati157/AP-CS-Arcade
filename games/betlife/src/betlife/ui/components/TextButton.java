package betlife.ui.components;

import java.awt.Cursor;

import javax.swing.JButton;

import betlife.ui.Theme;

/**
 * Low-emphasis text-only button ("Back") used under a primary action.
 * The text darkens on hover so it still feels clickable.
 */
public class TextButton extends JButton {

    public TextButton(String text) {
        super(text);
        setFont(Theme.TEXT_BUTTON);
        setForeground(Theme.AGE_TEXT_TEAL);
        setFocusPainted(false);
        setContentAreaFilled(false);
        setBorderPainted(false);
        setOpaque(false);
        setRolloverEnabled(true);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        getModel().addChangeListener(e ->
                setForeground(getModel().isRollover() ? Theme.PLAYER_NAME_TEAL : Theme.AGE_TEXT_TEAL));
    }
}
