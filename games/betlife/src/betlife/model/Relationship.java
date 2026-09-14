package betlife.model;

/**
 * Someone in the player's life: a family member or a friend, and how well the two get along.
 * The relationship level is a percentage (0-100) changed only through {@link #changeLevel(int)}.
 */
public class Relationship {

    private final String name;
    private final String type;
    private int level;
    private boolean interactedThisYear;

    public Relationship(String name, String type, int level) {
        this.name = name;
        this.type = type;
        this.level = clamp(level);
    }

    public String getName() {
        return name;
    }

    /** The part of the name before the first space, e.g. "Emma" for "Emma Carter". */
    public String getFirstName() {
        int space = name.indexOf(' ');
        return space < 0 ? name : name.substring(0, space);
    }

    /** How this person relates to the player, e.g. "Mother" or "Friend". */
    public String getType() {
        return type;
    }

    public int getLevel() {
        return level;
    }

    public void changeLevel(int amount) {
        level = clamp(level + amount);
    }

    public boolean isFamily() {
        return type.equals("Mother") || type.equals("Father");
    }

    /** Relationships the player spent time on this year do not drift apart at year end. */
    public boolean wasInteractedWithThisYear() {
        return interactedThisYear;
    }

    public void markInteracted() {
        interactedThisYear = true;
    }

    public void startNewYear() {
        interactedThisYear = false;
    }

    private static int clamp(int value) {
        return Math.max(Player.MIN_STAT, Math.min(Player.MAX_STAT, value));
    }
}
