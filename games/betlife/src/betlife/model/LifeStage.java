package betlife.model;

/**
 * The broad phase of life the player is in. It decides things like living costs,
 * which events can happen and which purchases make sense.
 */
public enum LifeStage {
    BABY("Baby"), CHILD("Child"), TEEN("Teen"), YOUNG_ADULT("Young Adult"), ADULT("Adult"), SENIOR("Senior");

    private final String label;

    LifeStage(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static LifeStage forAge(int age) {
        if (age <= 2) {
            return BABY;
        } else if (age <= 12) {
            return CHILD;
        } else if (age <= 17) {
            return TEEN;
        } else if (age <= 25) {
            return YOUNG_ADULT;
        } else if (age <= 64) {
            return ADULT;
        }
        return SENIOR;
    }
}
