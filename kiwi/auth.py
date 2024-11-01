import base64
import binascii

import bcrypt
from itsdangerous import TimestampSigner, BadSignature
from quart import request, current_app as app

from kiwi.errors import Forbidden, Unauthorized

async def raw_token_check(token: str, db=None) -> int:
    db = db or app.db

    fragments = token.split(".")
    user_id_str = fragments[0]

    try:
        user_id_decoded = base64.b64decode(user_id_str.encode())
        user_id = int(user_id_decoded)
    except (ValueError, binascii.Error):
        raise Unauthorized("invalid user ID type")

    pwd_hash = await db.fetchval(
        """SELECT password_hash FROM users WHERE id = $1""",
        user_id,
    )

    if not pwd_hash:
        raise Unauthorized("user ID not found")

    signer = TimestampSigner(pwd_hash)

    try:
        signer.unsign(token)

        await db.execute(
            """UPDATE users SET last_session = (now() at time zone 'utc') WHERE id = $1""",
            user_id,
        )

        return user_id
    except BadSignature:
        raise Forbidden("invalid token")
    
async def token_check() -> int:
    try:
        return request.user_id
    except AttributeError:
        pass

    try:
        token = request.headers["Authorization"]
    except KeyError:
        raise Unauthorized("no token provided")

    user_id = await raw_token_check(token)
    request.user_id = user_id
    return user_id

async def hash_data(data: str, loop=None) -> str:
    loop = loop or app.loop
    buf = data.encode()

    hashed = await loop.run_in_executor(None, bcrypt.hashpw, buf, bcrypt.gensalt(12))

    return hashed.decode()
