#!/bin/bash

cd src

uvicorn web:app --reload --port 8000