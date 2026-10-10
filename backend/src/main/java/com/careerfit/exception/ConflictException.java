package com.careerfit.exception;

import lombok.Getter;

@Getter
public class ConflictException extends RuntimeException {
    private final String fieldName;

    public ConflictException(String message, String fieldName) {
        super(message);
        this.fieldName = fieldName;
    }
}
