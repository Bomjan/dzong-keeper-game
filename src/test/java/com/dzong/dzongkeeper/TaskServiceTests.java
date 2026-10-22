package com.dzong.dzongkeeper;

import com.dzong.dzongkeeper.task.model.TaskRequest;
import com.dzong.dzongkeeper.task.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class TaskServiceTests {
    @Test
    void taskLifecycle() {
        var service = new TaskService();
        var created = service.create(new TaskRequest(" First task ", null, false));
        assertEquals("First task", created.title());
        assertEquals(created, service.get(created.id()));
        assertEquals(1, service.list().size());
        var updated = service.update(created.id(), new TaskRequest("Done", "Finished", true));
        assertTrue(updated.completed());
        assertEquals("Done", service.get(created.id()).title());
        service.delete(created.id());
        assertTrue(service.list().isEmpty());
        assertThrows(ResponseStatusException.class, () -> service.get(created.id()));
        assertThrows(ResponseStatusException.class,
                () -> service.update(created.id(), new TaskRequest("Missing", null, false)));
        assertThrows(ResponseStatusException.class, () -> service.delete(created.id()));
    }
}
