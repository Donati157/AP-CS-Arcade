package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.game.Choice;
import betlife.game.Decision;
import betlife.game.EventEffect;
import betlife.model.CareerState;
import betlife.model.Job;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.DecisionDialog;
import betlife.ui.components.InfoRow;
import betlife.ui.components.MoneyFormat;

/**
 * The Career screen: the current job, how it is going, and what the player can do about it.
 */
public class CareerPanel extends ActionScreen {

    private final ScreenNavigator navigator;

    public CareerPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Career", e -> navigator.showMainLife());
        this.navigator = navigator;
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        CareerState career = game.getCareer();
        clearContent();
        if (!career.isEmployed()) {
            addContent(new InfoRow("Status", "Not employed"));
            addSection("Actions");
            addAction("Browse Jobs", "See open positions", ActivityIcon.BRIEFCASE, e -> navigator.showJobs());
            revalidateContent();
            return;
        }
        Job job = career.getJob();
        addContent(new InfoRow("Position", job.getTitle()));
        addContent(new InfoRow("Company", job.getCompany()));
        addContent(new InfoRow("Salary", MoneyFormat.format(job.getSalary()) + " / year"));
        addContent(new InfoRow("Years employed", String.valueOf(career.getYearsEmployed())));
        addMeter("Performance", career.getPerformance());
        addActionsRow();

        addSection("Actions");
        addAction("Work Harder", "+6 Performance, -1 Happiness", ActivityIcon.ARROW_UP, e -> onWorkHarder());
        addAction("Take It Easy", "-4 Performance, +3 Happiness", ActivityIcon.SUN, e -> onTakeItEasy());
        addAction("Quit Job", "Leave " + job.getCompany(), ActivityIcon.ARROW_DOWN, e -> onQuit());
        revalidateContent();
    }

    private void onWorkHarder() {
        if (ensureActionAvailable()) {
            game.workHarder();
            refreshFromGameState();
            showFeedback("Hard Work", "Your effort was noticed. Performance +6, Happiness -1.");
        }
    }

    private void onTakeItEasy() {
        if (ensureActionAvailable()) {
            game.takeItEasyAtWork();
            refreshFromGameState();
            showFeedback("Easy Days", "You kept things relaxed at work. Performance -4, Happiness +3.");
        }
    }

    private void onQuit() {
        Decision confirm = new Decision("Quit Your Job?",
                "Are you sure you want to leave " + game.getCareer().getJob().getCompany() + "?")
                .add(new Choice("Quit", "", EventEffect.NONE))
                .add(new Choice("Stay", "", EventEffect.NONE));
        if (DecisionDialog.show(this, confirm) == 0) {
            game.quitJob();
            refreshFromGameState();
            navigator.showMainLife();
        }
    }
}
