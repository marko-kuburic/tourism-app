// src/main/java/com/example/tour/controller/DebugController.java
package com.example.tour.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/debug")
public class DebugController {

    @GetMapping(value = "/headers", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> headersGet(HttpServletRequest req) {
        return headersCommon(req, "GET");
    }

    @PostMapping(value = "/headers", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> headersPost(HttpServletRequest req) {
        return headersCommon(req, "POST");
    }

    private Map<String, Object> headersCommon(HttpServletRequest req, String method) {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, String> h = new LinkedHashMap<>();
        Enumeration<String> names = req.getHeaderNames();
        while (names.hasMoreElements()) {
            String n = names.nextElement();
            h.put(n.toLowerCase(), req.getHeader(n));
        }
        out.put("method", method);
        out.put("headers", h);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            out.put("principal", String.valueOf(auth.getPrincipal()));
            out.put("authorities", auth.getAuthorities());
            out.put("authenticated", auth.isAuthenticated());
        } else {
            out.put("principal", null);
            out.put("authenticated", false);
        }
        return out;
    }
}
