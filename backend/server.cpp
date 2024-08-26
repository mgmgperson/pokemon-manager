#include "Trainer.h"
#include "SinglesMatch.h"
#include <crow.h> // Crow is a lightweight C++ micro web framework

int main() {
    crow::SimpleApp app;

    // Route to simulate battle
    CROW_ROUTE(app, "/simulate-battle/<int>/<int>")
    ([](crow::request& req, crow::response& res, int trainer1_id, int trainer2_id) {
        // Fetch the trainers
        Trainer trainer1 = Trainer::fetchTrainerFromDB(trainer1_id);
        Trainer trainer2 = Trainer::fetchTrainerFromDB(trainer2_id);

        // Simulate the match
        SinglesMatch match(trainer1, trainer2);
        match.simulate();
        Trainer& winner = match.getWinner();

        // Create the response
        crow::json::wvalue result;
        result["winner"] = winner.getName();
        result["trainer1_name"] = trainer1.getName();
        result["trainer1_rating"] = trainer1.getRating();
        result["trainer2_name"] = trainer2.getName();
        result["trainer2_rating"] = trainer2.getRating();

        // Set CORS headers
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        // Send the response
        res.write(result.dump());
        res.end();
    });

    // CORS preflight route
    CROW_ROUTE(app, "/simulate-battle/<int>/<int>").methods(crow::HTTPMethod::Options)
    ([](crow::request&, crow::response& res, int, int) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.end();
    });

    // Start the server
    app.port(18080).multithreaded().run();
}
