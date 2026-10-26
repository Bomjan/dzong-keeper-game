package com.dzong.dzongkeeper.towerdefense.ui;

import java.io.*;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ConsoleGameTests {
    private String run(String commands) {
        ByteArrayOutputStream output=new ByteArrayOutputStream();
        new ConsoleGame().run(new ByteArrayInputStream(commands.getBytes(StandardCharsets.UTF_8)),new PrintStream(output));
        return output.toString(StandardCharsets.UTF_8);
    }
    @Test void malformedCommandsRecoverAndEofExits() {
        String output=run("what\nbuild\nbuild hi 3\nbuild NaN 3\ntick 0\nquit extra\nstatus\n");
        assertTrue(output.contains("Unknown command")); assertTrue(output.contains("Error:"));
        assertTrue(output.contains("Gold 120"));
    }
    @Test void consoleCanCompleteGameAndRestartWithLeaderboard() {
        String output=run("build 5 3\nbuild 10 5\nbuild 15 9\nwave\ntick 100\nwave\ntick 100\nwave\ntick 100\nscores\nnew\nscores\nquit\n");
        assertTrue(output.contains("VICTORY")); assertTrue(output.contains("GameResult[id=1"));
        assertTrue(output.contains("Gold 120")); assertFalse(output.contains("Error:"));
    }
}
