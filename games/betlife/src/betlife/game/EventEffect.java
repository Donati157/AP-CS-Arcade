package betlife.game;

/**
 * The stat changes an event or a choice causes. Zero means "no change".
 * Kept as plain fields so a new event can be written in one line.
 */
public class EventEffect {

    public static final EventEffect NONE = new EventEffect(0, 0, 0, 0);

    private final int happiness;
    private final int health;
    private final int smarts;
    private final int money;
    private int educationPerformance;
    private int friendCloseness;   // applied to one random friend
    private int familyCloseness;   // applied to every family member
    private boolean meetNewFriend;

    public EventEffect(int happiness, int health, int smarts, int money) {
        this.happiness = happiness;
        this.health = health;
        this.smarts = smarts;
        this.money = money;
    }

    // Builder-style extras so the common four stats stay readable.

    public EventEffect performance(int amount) {
        educationPerformance = amount;
        return this;
    }

    public EventEffect friend(int amount) {
        friendCloseness = amount;
        return this;
    }

    public EventEffect family(int amount) {
        familyCloseness = amount;
        return this;
    }

    public EventEffect newFriend() {
        meetNewFriend = true;
        return this;
    }

    public int getHappiness() {
        return happiness;
    }

    public int getHealth() {
        return health;
    }

    public int getSmarts() {
        return smarts;
    }

    public int getMoney() {
        return money;
    }

    public int getEducationPerformance() {
        return educationPerformance;
    }

    public int getFriendCloseness() {
        return friendCloseness;
    }

    public int getFamilyCloseness() {
        return familyCloseness;
    }

    public boolean meetsNewFriend() {
        return meetNewFriend;
    }
}
