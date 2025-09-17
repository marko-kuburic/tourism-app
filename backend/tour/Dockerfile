# ---- builder ----
    FROM maven:3.9-eclipse-temurin-17 AS builder
    WORKDIR /app
    
    ARG POM_PATH=pom.xml
    COPY ${POM_PATH} ./pom.xml
    
    RUN echo "=== POM PREVIEW (first 120 lines) ===" \
     && sed -n '1,120p' pom.xml \
     && echo "=== END OF POM PREVIEW ==="
    
    RUN mvn -q -DskipTests dependency:go-offline
    
    COPY src ./src
    RUN mvn -q -DskipTests clean package
    
  # Verifikacija sadržaja JAR-a (Spring Boot: BOOT-INF/classes)
    RUN set -eux; \
    JAR_PATH="$(ls -1 target/*.jar | head -n1)"; \
    echo "Built JAR: $JAR_PATH"; \
    jar tf "$JAR_PATH" | grep -q "BOOT-INF/classes/com/example/tour/TourServiceApplication.class" \
    || (echo "❌ main klasa nije pod BOOT-INF/classes/com/example/tour/ !" && exit 1); \
    jar tf "$JAR_PATH" | grep -q "BOOT-INF/classes/com/example/tour/controller/TourController.class" \
    || (echo "❌ TourController.class ne postoji u JAR-u!" && exit 1); \
    echo "✅ JAR sadrži očekivane klase."

    
    # ---- runtime ----
    FROM eclipse-temurin:17-jre
    WORKDIR /app
    COPY --from=builder /app/target/*.jar /app/app.jar
    EXPOSE 8084
    ENTRYPOINT ["java","-jar","/app/app.jar"]
    