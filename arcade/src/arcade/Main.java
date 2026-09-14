package arcade;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;

/**
 * Entry point of the AP CS Arcade: {@code java -cp out arcade.Main}.
 */
public class Main {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                // The default look and feel is acceptable.
            }
            new ArcadeFrame().setVisible(true);
        });
    }
}
