FROM python:3.13
RUN pip install poetry

COPY . .

RUN poetry install

CMD ["poetry", "run", "hypercorn", "run:app", "-b", "0.0.0.0:5050"]

