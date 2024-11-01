import re

from typing import Union, Dict, List, Optional
from cerberus import Validator

from kiwi.errors import BadRequest

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{2,30}$", re.A)
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", re.A)

class BirdeyeValidator(Validator):
    def _validate_type_username(self, value: str) -> bool:
        return bool(USERNAME_REGEX.match(value))

    def _validate_type_password(self, value: str) -> bool:
        return 0 < len(value) <= 70
    
    def _validate_type_email(self, value: str) -> bool:
        return bool(EMAIL_REGEX.match(value)) and len(value) < 256
    
def validate(
    reqjson: Optional[Union[Dict, List]],
    schema: Dict,
) -> Dict:
    validator = BirdeyeValidator(schema)

    if reqjson is None:
        raise BadRequest("no JSON provided")

    try:
        valid = validator.validate(reqjson)
    except Exception:
        raise Exception(f"error while validating: {reqjson}")

    if not valid:
        errs = validator.errors
        raise BadRequest("bad payload", errs)

    return validator.document

REGISTER = {
    "username": {"type": "username", "required": True},
    "email": {"type": "email", "required": True},
    "password": {"type": "password", "required": True},
}
