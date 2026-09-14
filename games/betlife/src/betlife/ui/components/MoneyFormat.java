package betlife.ui.components;

import java.util.Locale;

/**
 * Formats in-game money the same way on every computer.
 * Locale.US is fixed so 1250 is always "$1,250" and never "$1.250".
 */
public final class MoneyFormat {

    private MoneyFormat() {
        // Static helper only.
    }

    public static String format(int amount) {
        String formatted = String.format(Locale.US, "$%,d", Math.abs(amount));
        return amount < 0 ? "-" + formatted : formatted;
    }
}
