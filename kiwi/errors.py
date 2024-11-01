class BirdeyeError(Exception):
    status_code = 500

    @property
    def message(self) -> str:
        message = self.args[0]
        return message
    
class BadRequest(BirdeyeError):
    status_code = 400

class Unauthorized(BirdeyeError):
    status_code = 401

class Forbidden(BirdeyeError):
    status_code = 403

class NotFound(BirdeyeError):
    status_code = 404




