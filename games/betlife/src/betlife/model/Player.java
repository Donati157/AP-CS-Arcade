package betlife.model;

/**
 * The character whose life is being simulated.
 *
 * Happiness, health, smarts and looks are percentages (0-100). Money is a whole-dollar amount.
 * Education and career details live in their own state objects owned by the game.
 * All fields are private so the rest of the game can only change them through methods
 * that keep the values in a valid range.
 */
public class Player {

    public static final int MIN_STAT = 0;
    public static final int MAX_STAT = 100;

    private String name;
    private String occupation;
    private int age;
    private int happiness;
    private int health;
    private int smarts;
    private int looks;
    private int money;

    public Player(String name, String occupation, int age,
                  int happiness, int health, int smarts, int looks, int money) {
        this.name = name;
        this.occupation = occupation;
        this.age = age;
        this.happiness = clampStat(happiness);
        this.health = clampStat(health);
        this.smarts = clampStat(smarts);
        this.looks = clampStat(looks);
        this.money = money;
    }

    public String getName() {
        return name;
    }

    /** What the character currently does, e.g. "Student". Shown in the status strip. */
    public String getOccupation() {
        return occupation;
    }

    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }

    public LifeStage getLifeStage() {
        return LifeStage.forAge(age);
    }

    public int getAge() {
        return age;
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

    public int getLooks() {
        return looks;
    }

    public int getMoney() {
        return money;
    }

    /** Advances the character by one year. */
    public void ageUp() {
        age++;
    }

    public void changeHappiness(int amount) {
        happiness = clampStat(happiness + amount);
    }

    public void changeHealth(int amount) {
        health = clampStat(health + amount);
    }

    public void changeSmarts(int amount) {
        smarts = clampStat(smarts + amount);
    }

    public void changeLooks(int amount) {
        looks = clampStat(looks + amount);
    }

    /** True when the player has at least this much cash. */
    public boolean canAfford(int cost) {
        return money >= cost;
    }

    public void changeMoney(int amount) {
        money += amount;
    }

    /** Keeps percentage stats inside the 0-100 range. */
    private static int clampStat(int value) {
        return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
    }
}
