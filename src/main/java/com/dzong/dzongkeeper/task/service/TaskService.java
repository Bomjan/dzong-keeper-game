package com.dzong.dzongkeeper.task.service;

import com.dzong.dzongkeeper.task.model.Task;
import com.dzong.dzongkeeper.task.model.TaskRequest;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {
    private final ConcurrentHashMap<Long, Task> tasks = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong();

    public List<Task> list() {
        return tasks.values().stream().sorted(Comparator.comparingLong(Task::id)).toList();
    }

    public Task get(long id) {
        Task task = tasks.get(id);
        if (task == null) {
            throw notFound();
        }
        return task;
    }

    public Task create(TaskRequest request) {
        long id = sequence.incrementAndGet();
        Task task = fromRequest(id, request);
        tasks.put(id, task);
        return task;
    }

    public Task update(long id, TaskRequest request) {
        Task updated = tasks.computeIfPresent(id, (key, existing) -> fromRequest(key, request));
        if (updated == null) {
            throw notFound();
        }
        return updated;
    }

    public void delete(long id) {
        if (tasks.remove(id) == null) {
            throw notFound();
        }
    }

    private Task fromRequest(long id, TaskRequest request) {
        return new Task(id, request.title().trim(), request.description(), Boolean.TRUE.equals(request.completed()));
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
    }
}
