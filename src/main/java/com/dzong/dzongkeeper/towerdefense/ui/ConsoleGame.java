package com.dzong.dzongkeeper.towerdefense.ui;

import java.io.InputStream;
import java.io.PrintStream;
import java.util.Scanner;
import com.dzong.dzongkeeper.towerdefense.engine.GameEngine;
import com.dzong.dzongkeeper.towerdefense.model.*;
import com.dzong.dzongkeeper.towerdefense.structures.*;

public final class ConsoleGame {
    private final ScoreAvlTree leaderboard=new ScoreAvlTree();
    private GameEngine game=new GameEngine(leaderboard);
    private static final String HELP="""
            build <x> <y> | upgrade <id> | sell <id> | wave | tick [1..1000]
            pause | resume | status | inspect | scores | new | help | quit
            Start with 120 gold and 5 lives. Tower: 40 gold; upgrade: 30; max level: 3.
            Sell for half the total investment. Three waves; each escape costs one life.
            Score = kills*10 + completed waves*100 + remaining lives*20.
            Route: (0,0) -> (12,0) -> (12,12). Build off-path in [0,20] x [0,20].
            Suggested start: build 5 3, build 10 5, build 15 9, wave, tick 60.
            Time advances only with tick during an active wave. Use wave for each next wave.
            Leaderboard lasts until the console exits. new starts a fresh game.
            """;
    public static void main(String[] args) { new ConsoleGame().run(System.in,System.out); }
    public void run(InputStream input,PrintStream out) {
        Scanner scanner=new Scanner(input);
        out.println("THE LAST DZONG KEEPER - DSA console demo"); out.println(HELP); status(out);
        while (true) {
            out.print("dzong> ");
            if (!scanner.hasNextLine()) break;
            String line=scanner.nextLine().trim();
            if (line.isEmpty()) continue;
            String[] words=line.split("\\s+");
            try {
                switch (words[0].toLowerCase(java.util.Locale.ROOT)) {
                    case "quit", "exit" -> { arity(words,1); return; }
                    case "help" -> { arity(words,1); out.println(HELP); }
                    case "build" -> { arity(words,3); out.println("Built tower #"+game.build(Double.parseDouble(words[1]),Double.parseDouble(words[2]))); }
                    case "upgrade" -> { arity(words,2); game.upgrade(Integer.parseInt(words[1])); out.println("Tower upgraded"); }
                    case "sell" -> { arity(words,2); game.sell(Integer.parseInt(words[1])); out.println("Tower sold"); }
                    case "wave" -> { arity(words,1); game.startWave(); status(out); }
                    case "tick" -> {
                        if (words.length>2) throw new IllegalArgumentException("Usage: tick [1..1000]");
                        int count=words.length==1 ? 1 : Integer.parseInt(words[1]);
                        if (count<1 || count>1000) throw new IllegalArgumentException("Ticks must be in [1,1000]");
                        for (int i=0;i<count;i++) game.tick();
                        status(out);
                    }
                    case "pause", "resume" -> { arity(words,1); game.pause(words[0].equalsIgnoreCase("pause")); status(out); }
                    case "status" -> { arity(words,1); status(out); }
                    case "inspect" -> { arity(words,1); out.print(game.details()); }
                    case "scores" -> {
                        arity(words,1); Array<GameResult> results=leaderboard.top(10);
                        if (results.size()==0) out.println("No completed games yet");
                        for (int i=0;i<results.size();i++) out.println((i+1)+". "+results.get(i));
                    }
                    case "new" -> { arity(words,1); game=new GameEngine(leaderboard); status(out); }
                    default -> out.println("Unknown command. Type help.");
                }
            } catch (IllegalArgumentException error) { out.println("Error: "+error.getMessage()); }
        }
    }
    private static void arity(String[] words,int expected) {
        if (words.length!=expected) throw new IllegalArgumentException("Wrong number of arguments. Type help.");
    }
    private void status(PrintStream out) {
        GameState s=game.state();
        out.printf("Tick %d | Gold %d | Lives %d | Wave %d/3 | Enemies %d | Pending %d | Towers %d | %s%n",
                s.tick(),s.gold(),s.lives(),s.wave(),s.enemies(),s.pendingSpawns(),s.towers(),
                s.finished() ? (s.result().victory() ? "VICTORY" : "DEFEAT") : s.paused() ? "PAUSED" : s.waveActive() ? "DEFENDING" : "BUILD / NEXT WAVE");
        if (s.finished()) out.println("Final score: "+s.result().score()+". Use scores or new.");
    }
}
