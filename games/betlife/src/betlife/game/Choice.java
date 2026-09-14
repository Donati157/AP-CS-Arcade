package betlife.game;

/**
 * One option the player can pick in a decision: the button label, the journal line
 * that results, the stat effect, and optionally which screen to open afterwards.
 */
public class Choice {

    /** Screens a choice can lead to; NONE stays on the main screen. */
    public enum FollowUp { NONE, UNIVERSITY, JOBS }

    private final String label;
    private final String resultText;
    private final EventEffect effect;
    private final FollowUp followUp;

    public Choice(String label, String resultText, EventEffect effect) {
        this(label, resultText, effect, FollowUp.NONE);
    }

    public Choice(String label, String resultText, EventEffect effect, FollowUp followUp) {
        this.label = label;
        this.resultText = resultText;
        this.effect = effect;
        this.followUp = followUp;
    }

    public String getLabel() {
        return label;
    }

    public String getResultText() {
        return resultText;
    }

    public EventEffect getEffect() {
        return effect;
    }

    public FollowUp getFollowUp() {
        return followUp;
    }
}
