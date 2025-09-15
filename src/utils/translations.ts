import User from "../model/user.model";
import ErrorHandler from "./ErrorHandler";

export const errorTranslations = {
    English: {
        LOGIN_SUCCESS: "User login successfully",
        REGISTER_SUCCESS: "User registered successfully",
        INVALID_CREDENTIALS: "Invalid credentials. Please try again.",
        OTP_SENT: "A one-time password (OTP) has been sent to your email to reset your password.",
        OTP_VERIFIED: "OTP verified successfully.",
        PASSWORD_RESET: "Password has been reset successfully.",
        PROFILE_UPDATED: "Profile updated successfully",
        LANGUAGE_UPDATED: "Preferred language updated successfully.",
        USER_NOT_FOUND: "User not found",
        INVALID_EMAIL: "Invalid email",
        OTP_EXPIRED: "OTP has expired. Please request a new one.",
        USER_DETAILS_FETCHED: "User details fetched successfully",
        MISSING_FIELDS: "Missing required fields: language, level, or genre",
        MODULE_GENERATION_FAILED: "Failed to generate any modules.",
        INTERNAL_SERVER_ERROR: "Internal Server Error",
        BUILDER_ID_REQUIRED: "Builder ID is required.",
        MODULE_ID_REQUIRED: "Module ID is required.",
        TYPE_REQUIRED: "Type is required.",
        TYPE_INVALID: "Type must be one of: reading, listening, writing, speaking, lessonBuilder.",
        LANGUAGE_REQUIRED: "Language is required.",
        LANGUAGE_INVALID: 'Language must be one of: "german","english".',
        TEXT_REQUIRED: "Text is required.",
        TOPIC_REQUIRED: "Topic is required.",
        LEVEL_REQUIRED: "Level is required.",
        LEVEL_INVALID: "Level must be one of: beginner, intermediate, advanced.",
        FORMALITY_REQUIRED: "Formality is required.",
        WRITING_TYPE_REQUIRED: "Writing Type is required.",
        STYLE_REQUIRED: "Style is required.",
        LENGTH_OPTION_REQUIRED: "Length option is required.",
        LENGTH_REQUIRED: "Length is required.",
        ANSWERS_ARRAY: "Answers must be an array.",
        MESSAGE_REQUIRED: "Message is required.",
        STORY_TITLE_REQUIRED: "Story Title is required.",
        GENRE_REQUIRED: "Genre is required.",
    },
    German: {
        BUILDER_ID_REQUIRED: "Builder ID ist erforderlich.",
        MODULE_ID_REQUIRED: "Module ID ist erforderlich.",
        TYPE_REQUIRED: "Typ ist erforderlich.",
        TYPE_INVALID: "Typ muss einer der folgenden sein: reading, listening, writing, speaking, lessonBuilder.",
        LANGUAGE_REQUIRED: "Sprache ist erforderlich.",
        LANGUAGE_INVALID: 'Sprache muss eine der folgenden sein: "german","english".',
        TEXT_REQUIRED: "Text ist erforderlich.",
        TOPIC_REQUIRED: "Thema ist erforderlich.",
        LEVEL_REQUIRED: "Niveau ist erforderlich.",
        LEVEL_INVALID: "Niveau muss eines der folgenden sein: beginner, intermediate, advanced.",
        FORMALITY_REQUIRED: "Formality ist erforderlich.",
        WRITING_TYPE_REQUIRED: "Schreibart ist erforderlich.",
        STYLE_REQUIRED: "Stil ist erforderlich.",
        LENGTH_OPTION_REQUIRED: "Längenoption ist erforderlich.",
        LENGTH_REQUIRED: "Länge ist erforderlich.",
        ANSWERS_ARRAY: "Antworten müssen ein Array sein.",
        MESSAGE_REQUIRED: "Nachricht ist erforderlich.",
        STORY_TITLE_REQUIRED: "Story-Titel ist erforderlich.",
        GENRE_REQUIRED: "Genre ist erforderlich.",
        INTERNAL_SERVER_ERROR: "Interner Serverfehler",
        MODULE_GENERATION_FAILED: "Es konnten keine Module erstellt werden.",
        MISSING_FIELDS: "Fehlende Pflichtfelder: Sprache, Niveau oder Genre",
        USER_DETAILS_FETCHED: "Benutzerdetails erfolgreich abgerufen",
        LOGIN_SUCCESS: "Benutzer erfolgreich eingeloggt",
        REGISTER_SUCCESS: "Benutzer erfolgreich registriert",
        INVALID_CREDENTIALS: "Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.",
        OTP_SENT: "Ein einmaliges Passwort (OTP) wurde an Ihre E-Mail gesendet, um Ihr Passwort zurückzusetzen.",
        OTP_VERIFIED: "OTP erfolgreich verifiziert.",
        PASSWORD_RESET: "Passwort wurde erfolgreich zurückgesetzt.",
        PROFILE_UPDATED: "Profil erfolgreich aktualisiert",
        LANGUAGE_UPDATED: "Bevorzugte Sprache erfolgreich aktualisiert.",
        USER_NOT_FOUND: "Benutzer nicht gefunden",
        INVALID_EMAIL: "Ungültige E-Mail",
        OTP_EXPIRED: "OTP ist abgelaufen. Bitte fordern Sie ein neues an.",
    },
};


export const getUserLanguage = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ErrorHandler("Missing required fields: language level or genre", 400);
    }
    const language = user.preferredLanguage
    return language

}