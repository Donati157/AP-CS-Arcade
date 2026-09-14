package betlife;

/**
 * Standalone entry point for BetLife: {@code java -cp out betlife.Main}.
 * The arcade does not use this class; it calls {@link BetLifeLauncher} directly.
 */
public class Main {

    public static void main(String[] args) {
        BetLifeLauncher.launchStandalone();
    }
}
