export enum AuthCredentialStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    DEACTIVATED = 'DEACTIVATED',
    EXPIRED = 'EXPIRED',
    REVOKED = 'REVOKED',
    BLOCKED = 'BLOCKED',
}

export enum AuthProvider {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
    FACEBOOK = 'FACEBOOK',
    GITHUB = 'GITHUB',
    APPLE = 'APPLE',
    MICROSOFT = 'MICROSOFT',
    TWITTER = 'TWITTER',
    LINKEDIN = 'LINKEDIN',
    YANDEX = 'YANDEX',
    VKONTAKTE = 'VKONTAKTE',
    YAHOO = 'YAHOO',
    OAUTH = 'OAUTH',
    BLOCKED = 'BLOCKED',
}

export enum AuthGrantType {
    PASSWORD = 'password',
    REFRESH_TOKEN = 'refresh_token',
    AUTHORIZATION_CODE = 'authorization_code',
}

export enum AuthConfig {
  MAX_FAILED_LOGIN_ATTEMPTS = 6
}