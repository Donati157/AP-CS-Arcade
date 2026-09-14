package betlife.ui;

import java.awt.Color;
import java.awt.Font;
import java.awt.GraphicsEnvironment;
import java.util.Arrays;

/**
 * Central place for BetLife's palette, fonts and layout sizes.
 * UI classes read from here instead of scattering raw numbers and colors around.
 */
public final class Theme {

    private Theme() {
        // Constants only.
    }

    // Window (portrait, phone-like proportions)
    public static final int WINDOW_WIDTH = 512;
    public static final int WINDOW_HEIGHT = 760;

    // Vertical budget of the main screen (the timeline takes whatever is left)
    public static final int HEADER_HEIGHT = 56;
    public static final int STATUS_BAR_HEIGHT = 60;
    public static final int NAV_BAR_HEIGHT = 76;
    public static final int STATS_HEIGHT = 100;

    // Component sizes
    public static final int AVATAR_SIZE = 44;
    public static final int AGE_BUTTON_SIZE = 96;
    public static final int AGE_BUTTON_RISE = 24;   // how far the Age button rises above the nav bar
    public static final int NAV_ICON_SIZE = 20;
    public static final int NAV_ICON_RING = 34;     // circle drawn behind each nav icon
    public static final int STAT_BAR_HEIGHT = 9;
    public static final int SCREEN_PADDING = 12;
    public static final int HEADER_SIDE_WIDTH = 48;   // menu / back button area on each side of a header
    public static final int LIST_ROW_HEIGHT = 58;
    public static final int LIST_ICON_BADGE = 36;     // circle behind each list-row icon
    public static final int ACTION_BUTTON_HEIGHT = 46;

    // Palette
    public static final Color HEADER_RED = new Color(0xE0432F);
    public static final Color BRAND_ACCENT = new Color(0xFFE08A);
    public static final Color BRAND_OUTLINE = new Color(0x7A1F12);
    public static final Color NAV_BLUE = new Color(0x1C4E9A);
    public static final Color NAV_ICON_BACKGROUND = new Color(255, 255, 255, 46);
    public static final Color NAV_ICON_HOVER = new Color(255, 255, 255, 84);
    public static final Color NAV_ICON_PRESSED = new Color(255, 255, 255, 130);
    public static final Color AGE_GREEN = new Color(0x3DB04F);
    public static final Color AGE_GREEN_HOVER = new Color(0x4CC060);
    public static final Color AGE_GREEN_PRESSED = new Color(0x2F8C3E);
    public static final Color AGE_SHADOW = new Color(0, 0, 0, 80);
    public static final Color AGE_TEXT_TEAL = new Color(0x137A8C);
    public static final Color PLAYER_NAME_TEAL = new Color(0x155E7A);
    public static final Color PRIMARY_TEXT = new Color(0x222222);
    public static final Color SECONDARY_TEXT = new Color(0x5C6370);
    public static final Color MUTED_TEXT = new Color(0x8A8F98);
    public static final Color ON_DARK = Color.WHITE;
    public static final Color DIVIDER = new Color(0xD5DAE0);
    public static final Color STAT_TRACK = new Color(0xE4E7EB);
    public static final Color STAT_FILL = AGE_GREEN;
    public static final Color BACKGROUND = Color.WHITE;
    public static final Color STATUS_STRIP = new Color(0xE9EEF3);
    public static final Color SCROLL_THUMB = new Color(0xC4C9D0);
    public static final Color ROW_HOVER = new Color(0xF3F5F8);
    public static final Color ROW_PRESSED = new Color(0xE3E8EE);
    public static final Color ICON_BADGE = new Color(0xE3EEF7);
    public static final Color DIALOG_SHADE = new Color(0, 0, 0, 90);
    public static final Color POSITIVE_TEXT = new Color(0x2E8A44);

    // Stat indicator colors
    public static final Color HAPPINESS = new Color(0xF3B927);
    public static final Color HEALTH = new Color(0xE0484B);
    public static final Color SMARTS = new Color(0x3B82F6);
    public static final Color LOOKS = new Color(0xE85D9B);

    // Avatar colors
    public static final Color AVATAR_BACKGROUND = new Color(0xBFD8EC);
    public static final Color AVATAR_SKIN = new Color(0xF4C9A3);
    public static final Color AVATAR_HAIR = new Color(0x4A2E1B);
    public static final Color AVATAR_SHIRT = new Color(0x3DB04F);

    // Fonts
    private static final String FAMILY = "SansSerif";
    public static final Font BRAND = new Font(pickBrandFamily(), Font.BOLD, 30);
    public static final Font SCREEN_TITLE = new Font(FAMILY, Font.BOLD, 19);
    public static final Font NAME = new Font(FAMILY, Font.BOLD, 16);
    public static final Font ROW_TITLE = new Font(FAMILY, Font.BOLD, 15);
    public static final Font ROW_SUBTITLE = new Font(FAMILY, Font.PLAIN, 12);
    public static final Font PAGE_TITLE = new Font(FAMILY, Font.BOLD, 22);
    public static final Font BODY = new Font(FAMILY, Font.PLAIN, 14);
    public static final Font ACTION_BUTTON = new Font(FAMILY, Font.BOLD, 15);
    public static final Font TEXT_BUTTON = new Font(FAMILY, Font.BOLD, 14);
    public static final Font OCCUPATION = new Font(FAMILY, Font.PLAIN, 12);
    public static final Font MONEY = new Font(FAMILY, Font.BOLD, 17);
    public static final Font CAPTION = new Font(FAMILY, Font.PLAIN, 11);
    public static final Font TIMELINE_AGE = new Font(FAMILY, Font.BOLD, 15);
    public static final Font TIMELINE_TEXT = new Font(FAMILY, Font.PLAIN, 14);
    public static final Font TIMELINE_MILESTONE = new Font(FAMILY, Font.BOLD, 14);
    public static final Font NAV_LABEL = new Font(FAMILY, Font.BOLD, 11);
    public static final Font AGE_PLUS = new Font(FAMILY, Font.BOLD, 32);
    public static final Font AGE_LABEL = new Font(FAMILY, Font.BOLD, 15);
    public static final Font STAT_LABEL = new Font(FAMILY, Font.BOLD, 12);
    public static final Font STAT_VALUE = new Font(FAMILY, Font.PLAIN, 11);

    /**
     * A rounded font gives the wordmark a playful look, but it is not installed everywhere.
     * Fall back to the standard bold sans-serif so the game still runs on school computers.
     */
    private static String pickBrandFamily() {
        String[] installed = GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
        if (Arrays.asList(installed).contains("Arial Rounded MT Bold")) {
            return "Arial Rounded MT Bold";
        }
        return FAMILY;
    }
}
