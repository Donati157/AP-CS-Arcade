package betlife.game;

import betlife.model.EducationState;
import betlife.model.LifeEvent;

/**
 * A life event that can happen during a year. It is eligible between two ages and,
 * optionally, only in one situation (at high school, at university, or employed).
 * Events without a decision just happen; events with a decision ask the player first.
 */
public class RandomEvent {

    /** Situations an event can be limited to. */
    public enum Requires { ANYONE, HIGH_SCHOOL, UNIVERSITY, EMPLOYED }

    private final String text;
    private final int minAge;
    private final int maxAge;
    private final Requires requires;
    private final EventEffect effect;
    private final LifeEvent.Kind kind;
    private Decision decision;

    /** An event that simply happens. */
    public RandomEvent(String text, int minAge, int maxAge, Requires requires,
                       EventEffect effect, LifeEvent.Kind kind) {
        this.text = text;
        this.minAge = minAge;
        this.maxAge = maxAge;
        this.requires = requires;
        this.effect = effect;
        this.kind = kind;
    }

    /** An event that asks the player to choose. The decision's choices carry the effects. */
    public RandomEvent(String text, int minAge, int maxAge, Requires requires, Decision decision) {
        this(text, minAge, maxAge, requires, EventEffect.NONE, LifeEvent.Kind.NORMAL);
        this.decision = decision;
    }

    public String getText() {
        return text;
    }

    public EventEffect getEffect() {
        return effect;
    }

    public LifeEvent.Kind getKind() {
        return kind;
    }

    public boolean hasDecision() {
        return decision != null;
    }

    public Decision getDecision() {
        return decision;
    }

    public boolean isEligible(int age, EducationState education, boolean employed) {
        if (age < minAge || age > maxAge) {
            return false;
        }
        switch (requires) {
            case HIGH_SCHOOL:
                return education.getStage() == EducationState.Stage.HIGH_SCHOOL;
            case UNIVERSITY:
                return education.getStage() == EducationState.Stage.UNIVERSITY;
            case EMPLOYED:
                return employed;
            default:
                return true;
        }
    }
}
