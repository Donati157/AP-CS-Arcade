package betlife.game;

import java.util.ArrayList;

import betlife.game.Choice.FollowUp;
import betlife.model.CareerState;
import betlife.model.EducationState;
import betlife.model.LifeEvent.Kind;
import betlife.model.Player;
import betlife.model.Relationship;

/**
 * Everything that happens when a year passes: school advances, salary and living costs
 * are settled, relationships drift, health ages, and one life event is chosen.
 * Kept separate from {@link BetLifeGame} so the game class stays about state and actions.
 */
public class AgeProcessor {

    private static final int MOOD_BASELINE = 70;
    private static final int MOOD_SETTLE_STEP = 3;

    private final BetLifeGame game;

    public AgeProcessor(BetLifeGame game) {
        this.game = game;
    }

    /** Runs one full year for the player whose age was just incremented. */
    public void processYear() {
        // Living costs depend on how the year started: a graduating student is not charged yet.
        int expenses = game.yearlyExpenses();
        boolean graduated = processEducation();
        processCareerAndMoney(expenses);
        processRelationships();
        processHealth();
        processMood();
        EducationState education = game.getEducation();
        // A graduation decision takes priority over the year's random event.
        if (graduated && education.isHighSchoolGraduate() && !education.hasDegree()) {
            game.setPendingDecision(createAfterHighSchoolDecision());
        } else {
            processRandomEvent();
        }
    }

    /** Advances school by one year and journals graduations. Returns true when one happened. */
    private boolean processEducation() {
        EducationState education = game.getEducation();
        if (!education.isEnrolled()) {
            return false;
        }
        boolean wasHighSchool = education.getStage() == EducationState.Stage.HIGH_SCHOOL;
        boolean graduated = education.advanceYear();
        if (graduated && wasHighSchool) {
            game.addEvent("You graduated from " + EducationState.HIGH_SCHOOL_NAME + ".", Kind.MILESTONE);
            game.getPlayer().setOccupation("High School Graduate");
        } else if (graduated) {
            game.addEvent("You graduated from " + EducationState.UNIVERSITY_NAME
                    + " with a degree in " + education.getDegree() + ".", Kind.MILESTONE);
            game.getPlayer().setOccupation("Unemployed");
        }
        return graduated;
    }

    /** Pays a year of salary, charges a year of living costs, and lets job performance settle. */
    private void processCareerAndMoney(int expenses) {
        Player player = game.getPlayer();
        CareerState career = game.getCareer();
        if (career.isEmployed()) {
            int netIncome = (int) Math.round(career.getJob().getSalary() * BetLifeGame.NET_INCOME_SHARE);
            player.changeMoney(netIncome);
            if (!career.hasWorkedHardThisYear()) {
                career.changePerformance(-3);
            }
            career.completeYear();
        }
        if (expenses == 0) {
            return;
        }
        if (player.canAfford(expenses)) {
            player.changeMoney(-expenses);
        } else if (player.getMoney() > 0) {
            // Simplification: the player cannot go into debt; a hard year just empties the account.
            player.changeMoney(-player.getMoney());
            player.changeHappiness(-3);
            game.addEvent("Money was tight this year and you had to cut back on everything.");
        }
    }

    /** People drift apart a little each year unless the player made time for them. */
    private void processRelationships() {
        for (Relationship relationship : game.getRelationships()) {
            if (relationship.wasInteractedWithThisYear()) {
                relationship.changeLevel(1);
            } else {
                relationship.changeLevel(relationship.isFamily() ? -1 : -3);
            }
            relationship.startNewYear();
        }
    }

    /** Health slowly declines from middle age on. */
    private void processHealth() {
        if (game.getPlayer().getAge() >= 45) {
            game.getPlayer().changeHealth(-1);
        }
    }

    /**
     * Happiness settles a little toward an ordinary level each year, so a great year fades
     * unless the player keeps doing things that make them happy.
     */
    private void processMood() {
        int happiness = game.getPlayer().getHappiness();
        if (happiness > MOOD_BASELINE) {
            game.getPlayer().changeHappiness(-Math.min(MOOD_SETTLE_STEP, happiness - MOOD_BASELINE));
        } else if (happiness < MOOD_BASELINE) {
            game.getPlayer().changeHappiness(Math.min(MOOD_SETTLE_STEP, MOOD_BASELINE - happiness));
        }
    }

    private void processRandomEvent() {
        RandomEvent event = game.getEventEngine().pickEvent(
                game.getPlayer().getAge(), game.getEducation(), game.getCareer().isEmployed());
        if (event == null) {
            return;
        }
        if (event.hasDecision()) {
            game.setPendingDecision(event.getDecision());
        } else {
            applyEffect(event.getEffect());
            game.addEvent(event.getText(), event.getKind());
        }
    }

    private Decision createAfterHighSchoolDecision() {
        return new Decision("What's Next?", "High school is behind you. What do you want to do now?")
                .add(new Choice("Go to university", "You decided to continue your education at university.",
                        EventEffect.NONE, FollowUp.UNIVERSITY))
                .add(new Choice("Find a job", "You decided to start working right away.",
                        EventEffect.NONE, FollowUp.JOBS))
                .add(new Choice("Take some time off", "You decided to take some time off to figure things out.",
                        new EventEffect(3, 0, 0, 0)));
    }

    /** Applies an event's or choice's consequences to the player and the people around them. */
    void applyEffect(EventEffect effect) {
        Player player = game.getPlayer();
        player.changeHappiness(effect.getHappiness());
        player.changeHealth(effect.getHealth());
        player.changeSmarts(effect.getSmarts());
        player.changeMoney(effect.getMoney());
        if (effect.getEducationPerformance() != 0 && game.getEducation().isEnrolled()) {
            game.getEducation().changePerformance(effect.getEducationPerformance());
        }
        if (effect.getFriendCloseness() != 0) {
            Relationship friend = pickRandomFriend();
            if (friend != null) {
                friend.changeLevel(effect.getFriendCloseness());
            }
        }
        if (effect.getFamilyCloseness() != 0) {
            for (Relationship relationship : game.getRelationships()) {
                if (relationship.isFamily()) {
                    relationship.changeLevel(effect.getFamilyCloseness());
                }
            }
        }
        if (effect.meetsNewFriend()) {
            game.meetNewFriend();
        }
    }

    private Relationship pickRandomFriend() {
        ArrayList<Relationship> friends = new ArrayList<>();
        for (Relationship relationship : game.getRelationships()) {
            if (!relationship.isFamily()) {
                friends.add(relationship);
            }
        }
        return friends.isEmpty() ? null : friends.get(game.getRandom().nextInt(friends.size()));
    }
}
