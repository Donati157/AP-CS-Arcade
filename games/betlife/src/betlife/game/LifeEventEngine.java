package betlife.game;

import java.util.ArrayList;
import java.util.Random;

import betlife.game.RandomEvent.Requires;
import betlife.model.EducationState;
import betlife.model.LifeEvent.Kind;

/**
 * The pool of random life events and the logic that picks one each year.
 * Everything here is original BetLife content. The game passes in its Random so
 * tests can seed it and get the same life every time.
 */
public class LifeEventEngine {

    private static final int NO_LIMIT = 200;

    private final ArrayList<RandomEvent> pool = new ArrayList<>();
    private final Random random;
    private RandomEvent lastEvent;

    public LifeEventEngine(Random random) {
        this.random = random;
        addTeenEvents();
        addGeneralEvents();
        addUniversityEvents();
        addWorkEvents();
    }

    /**
     * Picks a random event the player is eligible for, avoiding last year's event.
     * Returns null only if nothing at all is eligible.
     */
    public RandomEvent pickEvent(int age, EducationState education, boolean employed) {
        ArrayList<RandomEvent> eligible = new ArrayList<>();
        for (RandomEvent event : pool) {
            if (event.isEligible(age, education, employed) && event != lastEvent) {
                eligible.add(event);
            }
        }
        if (eligible.isEmpty()) {
            return null;
        }
        lastEvent = eligible.get(random.nextInt(eligible.size()));
        return lastEvent;
    }

    public int getPoolSize() {
        return pool.size();
    }

    // ---- The pool ------------------------------------------------------------

    private void addTeenEvents() {
        pool.add(new RandomEvent("A classmate invites you to join the robotics club.", 13, 17, Requires.HIGH_SCHOOL,
                new Decision("Robotics Club", "A classmate invites you to join the robotics club after school.")
                        .add(new Choice("Join the club", "You joined the robotics club and made new friends.",
                                new EventEffect(3, 0, 2, 0).friend(3)))
                        .add(new Choice("Decline", "You decided to keep your afternoons free.", EventEffect.NONE))));
        pool.add(new RandomEvent("Your class was assigned a big group project, and you carried your share of the work.",
                13, 17, Requires.HIGH_SCHOOL, new EventEffect(0, 0, 2, 0).performance(3), Kind.NORMAL));
        pool.add(new RandomEvent("The school talent show is coming up.", 13, 17, Requires.HIGH_SCHOOL,
                new Decision("Talent Show", "The school is holding a talent show. Do you sign up to perform?")
                        .add(new Choice("Perform", "You performed at the talent show and the crowd loved it.",
                                new EventEffect(4, 0, 0, 0)))
                        .add(new Choice("Watch from the audience", "You cheered for your friends at the talent show.",
                                new EventEffect(1, 0, 0, 0)))));
        pool.add(new RandomEvent("Your family went on a weekend camping trip together.", 5, 17, Requires.ANYONE,
                new EventEffect(3, 1, 0, 0).family(2), Kind.POSITIVE));
        pool.add(new RandomEvent("You received a small birthday gift from your family.", 3, 25, Requires.ANYONE,
                new EventEffect(1, 0, 0, 50), Kind.POSITIVE));
        pool.add(new RandomEvent("A neighbor offers to pay you to walk their dog.", 12, 17, Requires.ANYONE,
                new Decision("Dog Walking", "A neighbor offers to pay you to walk their dog every week this year.")
                        .add(new Choice("Accept", "You walked the neighbor's dog all year and earned some money.",
                                new EventEffect(1, 1, 0, 150)))
                        .add(new Choice("Decline", "You told the neighbor you were too busy this year.", EventEffect.NONE))));
        pool.add(new RandomEvent("A new student joined your class, and the two of you became friends.", 6, 17, Requires.HIGH_SCHOOL,
                new EventEffect(2, 0, 0, 0).newFriend(), Kind.POSITIVE));
        pool.add(new RandomEvent("A friend asks for help before a big test.", 13, 17, Requires.HIGH_SCHOOL,
                new Decision("Study Buddy", "A friend asks you to help them study before a big test.")
                        .add(new Choice("Help them", "You spent the evening helping a friend study.",
                                new EventEffect(1, 0, 1, 0).friend(5)))
                        .add(new Choice("Say you're busy", "You told your friend you were too busy to help.",
                                new EventEffect(1, 0, 0, 0).friend(-3)))));
        pool.add(new RandomEvent("Exams were tougher than expected this year, but you got through them.", 14, 17, Requires.HIGH_SCHOOL,
                new EventEffect(-2, 0, 1, 0), Kind.NORMAL));
    }

    private void addGeneralEvents() {
        pool.add(new RandomEvent("You lost your wallet at the mall and never found it.", 12, NO_LIMIT, Requires.ANYONE,
                new EventEffect(-2, 0, 0, -40), Kind.NORMAL));
        pool.add(new RandomEvent("You helped organize a community cleanup day.", 14, NO_LIMIT, Requires.ANYONE,
                new EventEffect(3, 0, 0, 0), Kind.POSITIVE));
        pool.add(new RandomEvent("Your friends threw you a surprise party.", 15, NO_LIMIT, Requires.ANYONE,
                new EventEffect(5, 0, 0, 0).friend(3), Kind.POSITIVE));
        pool.add(new RandomEvent("You caught a bad cold and spent a week in bed.", 5, NO_LIMIT, Requires.ANYONE,
                new EventEffect(-1, -3, 0, 0), Kind.NORMAL));
        pool.add(new RandomEvent("An old friend is visiting town.", 16, NO_LIMIT, Requires.ANYONE,
                new Decision("Catching Up", "An old friend is visiting town and wants to catch up.")
                        .add(new Choice("Meet up", "You spent a great afternoon catching up with an old friend.",
                                new EventEffect(2, 0, 0, 0).friend(6)))
                        .add(new Choice("Too busy", "You never found time to meet your visiting friend.",
                                new EventEffect(0, 0, 0, 0).friend(-4)))));
        pool.add(new RandomEvent("You picked up photography as a new hobby.", 12, NO_LIMIT, Requires.ANYONE,
                new EventEffect(3, 0, 0, 0), Kind.POSITIVE));
        pool.add(new RandomEvent("An unexpected repair bill arrived this year.", 18, NO_LIMIT, Requires.ANYONE,
                new EventEffect(-1, 0, 0, -120), Kind.NORMAL));
        pool.add(new RandomEvent("A local charity asked for volunteers.", 16, NO_LIMIT, Requires.ANYONE,
                new Decision("Volunteering", "A local charity is looking for weekend volunteers.")
                        .add(new Choice("Volunteer", "You volunteered on weekends and met wonderful people.",
                                new EventEffect(3, 0, 0, 0).newFriend()))
                        .add(new Choice("Not this year", "You decided not to volunteer this year.", EventEffect.NONE))));
    }

    private void addUniversityEvents() {
        pool.add(new RandomEvent("You found a great deal on used textbooks and saved some money.", 18, 30, Requires.UNIVERSITY,
                new EventEffect(1, 0, 0, 60), Kind.POSITIVE));
        pool.add(new RandomEvent("A professor offers you a research assistant position.", 18, 30, Requires.UNIVERSITY,
                new Decision("Research Assistant", "A professor offers you a paid spot as a research assistant this year.")
                        .add(new Choice("Accept", "You worked as a research assistant and learned a lot.",
                                new EventEffect(-1, 0, 3, 300).performance(4)))
                        .add(new Choice("Decline", "You turned down the research position to focus on classes.",
                                new EventEffect(1, 0, 0, 0)))));
        pool.add(new RandomEvent("Your roommate suggests starting a study group.", 18, 30, Requires.UNIVERSITY,
                new Decision("Study Group", "Your roommate suggests forming a weekly study group.")
                        .add(new Choice("Join", "The weekly study group kept you on top of your classes.",
                                new EventEffect(1, 0, 2, 0).performance(4).friend(2)))
                        .add(new Choice("Study alone", "You preferred to study on your own this year.", EventEffect.NONE))));
        pool.add(new RandomEvent("Campus life was busy this year, with late nights and early classes.", 18, 30, Requires.UNIVERSITY,
                new EventEffect(1, -1, 1, 0), Kind.NORMAL));
    }

    private void addWorkEvents() {
        pool.add(new RandomEvent("A coworker invites you to join the company soccer team.", 18, NO_LIMIT, Requires.EMPLOYED,
                new Decision("Company Team", "A coworker invites you to join the company soccer team.")
                        .add(new Choice("Join the team", "You played on the company soccer team all season.",
                                new EventEffect(2, 3, 0, 0).newFriend()))
                        .add(new Choice("Decline", "You decided team sports were not for you this year.", EventEffect.NONE))));
        pool.add(new RandomEvent("Your manager offered you extra shifts.", 18, NO_LIMIT, Requires.EMPLOYED,
                new Decision("Extra Shifts", "Your manager asks if you want to take on extra shifts this year.")
                        .add(new Choice("Take the shifts", "You worked extra shifts and earned a nice bonus.",
                                new EventEffect(-2, -1, 0, 400)))
                        .add(new Choice("Keep your hours", "You kept your regular hours and enjoyed your free time.",
                                new EventEffect(1, 0, 0, 0)))));
        pool.add(new RandomEvent("You received a year-end bonus for your dedication at work.", 18, NO_LIMIT, Requires.EMPLOYED,
                new EventEffect(2, 0, 0, 500), Kind.POSITIVE));
        pool.add(new RandomEvent("A busy season at work left you tired but proud of what you accomplished.", 18, NO_LIMIT, Requires.EMPLOYED,
                new EventEffect(1, -1, 1, 0), Kind.NORMAL));
    }
}
