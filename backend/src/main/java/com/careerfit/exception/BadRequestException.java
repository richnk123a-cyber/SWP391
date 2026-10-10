package com.careerfit.exception;

import lombok.Getter;

@Getter
public class BadRequestException extends RuntimeException {
    private final String fieldName;

    public BadRequestException(String message) {
        super(message);
        this.fieldName = null;
    }

    public BadRequestException(String message, String fieldName) {
        super(message);
        this.fieldName = fieldName;
    }
}
