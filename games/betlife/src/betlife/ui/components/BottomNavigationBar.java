package betlife.ui.components;

import java.awt.Dimension;
import java.awt.GridLayout;
import java.awt.event.ActionListener;

import javax.swing.JPanel;

import betlife.ui.Theme;

/**
 * Navy navigation bar with four icon items and the round Age button in the middle.
 *
 * The Age button rises above the bar, so this panel is taller than the bar itself:
 * the bar sits at the bottom and the button is placed on top of it by {@link #doLayout()}.
 */
public class BottomNavigationBar extends JPanel {

    private final JPanel bar = new JPanel(new GridLayout(1, 5));
    private final AgeButton ageButton = new AgeButton();
    private final NavItemButton educationItem;

    /**
     * @param navListener receives clicks on the four side items; the item name is the action command
     * @param ageListener receives clicks on the Age button
     */
    public BottomNavigationBar(ActionListener navListener, ActionListener ageListener) {
        setLayout(null);   // positions are computed in doLayout()
        setOpaque(false);  // the area above the bar must show whatever is behind it
        setPreferredSize(new Dimension(10, Theme.NAV_BAR_HEIGHT + Theme.AGE_BUTTON_RISE));

        bar.setBackground(Theme.NAV_BLUE);
        educationItem = createNavItem("School", NavIcon.SCHOOL, navListener);
        bar.add(educationItem);
        bar.add(createNavItem("Assets", NavIcon.ASSETS, navListener));
        bar.add(createSpacer());
        bar.add(createNavItem("Relationships", NavIcon.RELATIONSHIPS, navListener));
        bar.add(createNavItem("Activities", NavIcon.ACTIVITIES, navListener));

        ageButton.addActionListener(ageListener);

        // Added first so it paints above the bar.
        add(ageButton);
        add(bar);
    }

    @Override
    public void doLayout() {
        int width = getWidth();
        int height = getHeight();
        bar.setBounds(0, height - Theme.NAV_BAR_HEIGHT, width, Theme.NAV_BAR_HEIGHT);
        int size = Theme.AGE_BUTTON_SIZE;
        ageButton.setBounds((width - size) / 2, 0, size, size);
    }

    /** The first item follows the player's life: School, Career or Jobs. */
    public void setEducationItem(String name, String iconKind) {
        educationItem.setItem(name, iconKind);
    }

    private NavItemButton createNavItem(String name, String iconKind, ActionListener listener) {
        NavItemButton item = new NavItemButton(name, iconKind);
        item.addActionListener(listener);
        return item;
    }

    /** Empty middle column; the Age button floats over it. */
    private static JPanel createSpacer() {
        JPanel spacer = new JPanel();
        spacer.setOpaque(false);
        return spacer;
    }
}
