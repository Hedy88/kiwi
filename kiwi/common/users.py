from typing import Tuple
from asyncpg import UniqueViolationError
from quart import current_app as app

from kiwi.auth import hash_data
from kiwi.errors import BadRequest

async def check_username_usage(username: str):
    same_username = app.db.fetchval(
        """SELECT COUNT(*) FROM users WHERE username = $1""",
        username
    )

    if same_username > 0:
        raise BadRequest("This username is already taken.")
    
async def create_user(username: str, email: str, password: str) -> Tuple[int, str]:
    new_id = app.winter_factory.snowflake()
    password_hash = await hash_data(password)

    try:
        await app.db.execute(
            """
            INSERT INTO users
                (id, username, email, password_hash)
            VALUES
                ($1, $2, $3, $4)
            """,
            new_id,
            username,
            email,
            password_hash
        )
    except UniqueViolationError:
        raise BadRequest("This e-mail has already been taken")

    return new_id, password_hash
