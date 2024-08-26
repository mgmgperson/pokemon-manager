#ifndef SINGLES_MATCH_H
#define SINGLES_MATCH_H

#include "Trainer.h"

class SinglesMatch {
public:
    SinglesMatch(Trainer& trainer1, Trainer& trainer2);
    void simulate();
    Trainer& getWinner();

private:
    Trainer& trainer1;
    Trainer& trainer2;
    Trainer* winner;
};

#endif
