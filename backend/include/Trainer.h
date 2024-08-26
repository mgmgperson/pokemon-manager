#ifndef TRAINER_H
#define TRAINER_H

#include <string>

class Trainer {
public:
    Trainer(int id, std::string name, double rating);
    
    int getId() const;
    std::string getName() const;
    double getRating() const;

    static Trainer fetchTrainerFromDB(int id);

private:
    int id;
    std::string name;
    double rating;
};

#endif
