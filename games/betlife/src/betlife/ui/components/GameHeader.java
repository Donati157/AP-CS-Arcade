package betlife.ui.components;

import java.awt.event.ActionListener;

/**
 * The main life screen's header: menu button on the left and the BETLIFE wordmark centered.
 */
public class GameHeader extends ScreenHeader {

    public GameHeader(ActionListener menuAction) {
        super(createMenuButton(menuAction), new BrandLabel());
    }

    private static HeaderIconButton createMenuButton(ActionListener menuAction) {
        HeaderIconButton menu = new HeaderIconButton(HeaderIconButton.MENU, "Menu");
        menu.addActionListener(menuAction);
        return menu;
    }
}
