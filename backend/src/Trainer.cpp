#include "Trainer.h"
#include <sqlite3.h>
#include <iostream>

Trainer::Trainer(int id, std::string name, double rating) : id(id), name(name), rating(rating) {}

int Trainer::getId() const { return id; }
std::string Trainer::getName() const { return name; }
double Trainer::getRating() const { return rating; }

Trainer Trainer::fetchTrainerFromDB(int id) {
    sqlite3* db;
    int rc = sqlite3_open("../../database/db.sqlite", &db);

    if (rc) {
        std::cerr << "Can't open database for Trainer ID " << id << ": " << sqlite3_errmsg(db) << std::endl;
        sqlite3_close(db);
        return Trainer(0, "", 0.0);
    }

    std::cout << "Opened database successfully for Trainer ID " << id << std::endl;

    std::string sql = "SELECT id, fname, pwtr_rating FROM trainer WHERE id = ?";
    sqlite3_stmt* stmt;
    Trainer trainer(0, "", 0.0);

    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            trainer = Trainer(
                sqlite3_column_int(stmt, 0),
                reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1)),
                sqlite3_column_double(stmt, 2)
            );
            std::cout << "Fetched Trainer ID " << trainer.getId() << " with name: " << trainer.getName() << " and rating: " << trainer.getRating() << std::endl;
        } else {
            std::cerr << "No trainer found with ID " << id << std::endl;
        }
    } else {
        std::cerr << "Failed to prepare statement for Trainer ID " << id << ": " << sqlite3_errmsg(db) << std::endl;
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return trainer;
}

